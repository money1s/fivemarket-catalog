const GITHUB_API = "https://api.github.com";

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function getHeader(headers, name) {
  if (!headers) {
    return "";
  }

  return headers[name] || headers[name.toLowerCase()] || "";
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function encodePathSegments(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function githubRequest({ token, method, path, body }) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "fivemarket-cms-publish-all",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${path} -> ${response.status}: ${responseText.slice(0, 320)}`);
  }

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

async function getFileShaFromBranch({ token, owner, repo, branch, filePath }) {
  const encodedPath = encodePathSegments(filePath);
  const result = await githubRequest({
    token,
    method: "GET",
    path: `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
  });

  if (!result || typeof result !== "object" || !result.sha) {
    throw new Error(`Cannot resolve blob SHA for ${filePath} in ${branch}`);
  }

  return result.sha;
}

exports.handler = async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method Not Allowed" });
  }

  const user = context?.clientContext?.user || null;
  if (!user) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const userEmail = String(user.email || "").toLowerCase();
  const allowedEmails = splitCsv(process.env.CMS_PUBLISH_ALLOWED_EMAILS);
  if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
    return json(403, { ok: false, error: "Access denied for this user" });
  }

  const owner = String(process.env.GITHUB_OWNER || "").trim();
  const repo = String(process.env.GITHUB_REPO || "").trim();
  const token = String(process.env.GITHUB_TOKEN || "").trim();
  const deleteBranchesAfterPublish = String(process.env.CMS_DELETE_MERGED_BRANCHES || "true").toLowerCase() !== "false";

  if (!owner || !repo || !token) {
    return json(500, {
      ok: false,
      error: "Missing env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN",
    });
  }

  try {
    const refs = await githubRequest({
      token,
      method: "GET",
      path: `/repos/${owner}/${repo}/git/matching-refs/heads/cms/products/`,
    });

    const cmsBranches = Array.isArray(refs)
      ? refs
          .map((item) => String(item?.ref || ""))
          .filter((ref) => ref.startsWith("refs/heads/cms/products/"))
          .map((ref) => ref.replace("refs/heads/", ""))
          .sort((a, b) => a.localeCompare(b, "uk"))
      : [];

    if (cmsBranches.length === 0) {
      return json(200, {
        ok: true,
        message: "Немає збережених карток для публікації.",
        merged_branches: 0,
      });
    }

    const mainRef = await githubRequest({
      token,
      method: "GET",
      path: `/repos/${owner}/${repo}/git/ref/heads/main`,
    });

    const baseMainCommitSha = mainRef?.object?.sha;
    if (!baseMainCommitSha) {
      throw new Error("Cannot resolve main branch SHA");
    }

    const mainCommit = await githubRequest({
      token,
      method: "GET",
      path: `/repos/${owner}/${repo}/git/commits/${baseMainCommitSha}`,
    });

    const baseTreeSha = mainCommit?.tree?.sha;
    if (!baseTreeSha) {
      throw new Error("Cannot resolve main tree SHA");
    }

    const treeMap = new Map();
    const branchesWithChanges = [];

    for (const branch of cmsBranches) {
      const compare = await githubRequest({
        token,
        method: "GET",
        path: `/repos/${owner}/${repo}/compare/${encodeURIComponent("main")}...${encodeURIComponent(branch)}`,
      });

      const files = Array.isArray(compare?.files) ? compare.files : [];
      if (!files.length) {
        continue;
      }

      branchesWithChanges.push(branch);

      for (const file of files) {
        const status = String(file?.status || "");
        const filename = String(file?.filename || "");

        if (!filename) {
          continue;
        }

        if (status === "renamed" && file.previous_filename) {
          treeMap.set(String(file.previous_filename), {
            path: String(file.previous_filename),
            mode: "100644",
            type: "blob",
            sha: null,
          });
        }

        if (status === "removed") {
          treeMap.set(filename, {
            path: filename,
            mode: "100644",
            type: "blob",
            sha: null,
          });
          continue;
        }

        const blobSha = file?.sha || (await getFileShaFromBranch({ token, owner, repo, branch, filePath: filename }));
        treeMap.set(filename, {
          path: filename,
          mode: "100644",
          type: "blob",
          sha: String(blobSha),
        });
      }
    }

    if (!treeMap.size || !branchesWithChanges.length) {
      return json(200, {
        ok: true,
        message: "Немає нових змін для публікації.",
        merged_branches: 0,
      });
    }

    const newTree = await githubRequest({
      token,
      method: "POST",
      path: `/repos/${owner}/${repo}/git/trees`,
      body: {
        base_tree: baseTreeSha,
        tree: Array.from(treeMap.values()),
      },
    });

    const authorName =
      (user?.user_metadata && typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()) ||
      user.email ||
      "FiveMarket CMS";
    const authorEmail = user.email || process.env.GITHUB_COMMIT_EMAIL || "noreply@fivemarket.local";

    const branchListPreview = branchesWithChanges.slice(0, 20).map((branch) => `- ${branch}`).join("\n");
    const branchListTail = branchesWithChanges.length > 20 ? "\n- ..." : "";

    const commit = await githubRequest({
      token,
      method: "POST",
      path: `/repos/${owner}/${repo}/git/commits`,
      body: {
        message: `chore(cms): publish ${branchesWithChanges.length} saved product card(s)\n\nBranches:\n${branchListPreview}${branchListTail}`,
        tree: newTree.sha,
        parents: [baseMainCommitSha],
        author: {
          name: authorName,
          email: authorEmail,
        },
      },
    });

    await githubRequest({
      token,
      method: "PATCH",
      path: `/repos/${owner}/${repo}/git/refs/heads/main`,
      body: {
        sha: commit.sha,
        force: false,
      },
    });

    const deletedBranches = [];
    const deleteErrors = [];

    if (deleteBranchesAfterPublish) {
      for (const branch of cmsBranches) {
        try {
          await githubRequest({
            token,
            method: "DELETE",
            path: `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
          });
          deletedBranches.push(branch);
        } catch (error) {
          deleteErrors.push({
            branch,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return json(200, {
      ok: true,
      message: `Опубліковано ${branchesWithChanges.length} карток. Запущено 1 деплой.`,
      merged_branches: branchesWithChanges.length,
      changed_files: treeMap.size,
      commit_sha: commit.sha,
      commit_sha_short: String(commit.sha).slice(0, 7),
      deleted_branches: deletedBranches.length,
      delete_errors: deleteErrors,
      user: user.email || "",
      request_id: getHeader(event.headers, "x-nf-request-id") || "",
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
