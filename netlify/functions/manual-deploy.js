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

exports.handler = async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const user = context?.clientContext?.user || null;
  if (!user) {
    return json(401, { error: "Unauthorized" });
  }

  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL || "";
  if (!hookUrl) {
    return json(500, { error: "NETLIFY_BUILD_HOOK_URL is not configured" });
  }

  try {
    const hookResponse = await fetch(hookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trigger: "admin-manual-deploy",
        user_email: user.email || "",
      }),
    });

    const hookText = await hookResponse.text();
    if (!hookResponse.ok) {
      return json(502, {
        error: "Failed to trigger deploy hook",
        details: hookText.slice(0, 300),
      });
    }

    return json(200, {
      ok: true,
      message: "Deploy queued",
      response: hookText.slice(0, 300),
    });
  } catch (error) {
    return json(500, {
      error: "Unexpected deploy hook error",
      details: String(error),
    });
  }
};
