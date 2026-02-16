(function initFmPublishAllTool() {
  "use strict";

  if (window.__fmToolsInited) {
    return;
  }
  window.__fmToolsInited = true;

  const TOOLS_VERSION = "2026-02-16-1";
  const PUBLISH_ENDPOINT = "/.netlify/functions/publish-all-ready";
  const ROUTE_WORKFLOW = "#/workflow";

  const state = {
    running: false,
  };

  const refs = createPanel();
  bindActions();

  bootstrap().catch((error) => {
    setStatus(`Помилка ініціалізації: ${error instanceof Error ? error.message : String(error)}`, true);
  });

  async function bootstrap() {
    refs.version.textContent = `tools v=${TOOLS_VERSION}`;
    setupIdentityRedirect();
    await ensureCmsInitialized();

    if (!window.location.hash || window.location.hash === "#/" || window.location.hash === "#") {
      window.location.hash = ROUTE_WORKFLOW;
    }

    setStatus("Готово. Натисніть «Опублікувати все».", false);
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.id = "fm-publish-all";
    panel.className = "fm-publish";
    panel.innerHTML = `
      <div class="fm-publish__head">
        <h3 class="fm-publish__title">Публікація</h3>
        <span class="fm-publish__version" data-version></span>
      </div>
      <p class="fm-publish__hint">Опублікує всі збережені картки товарів одним запуском.</p>
      <button type="button" class="fm-publish__button" data-publish>Опублікувати все</button>
      <p class="fm-publish__status" data-status>Завантаження...</p>
    `;

    document.body.appendChild(panel);

    return {
      panel,
      version: panel.querySelector("[data-version]"),
      publishButton: panel.querySelector("[data-publish]"),
      status: panel.querySelector("[data-status]"),
    };
  }

  function bindActions() {
    refs.publishButton?.addEventListener("click", async () => {
      if (state.running) {
        return;
      }

      state.running = true;
      setButtonLoading(true);
      setStatus("Публікую всі збережені картки...", false);

      try {
        const response = await fetch(PUBLISH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const payload = await readJsonSafe(response);

        if (!response.ok || !payload.ok) {
          const errorMessage = payload.error || payload.message || `HTTP ${response.status}`;
          setStatus(`Помилка: ${errorMessage}`, true);
          return;
        }

        const mergedBranches = Number(payload.merged_branches || 0);
        const commitShort = payload.commit_sha_short || "";

        if (mergedBranches === 0) {
          setStatus(payload.message || "Немає карток для публікації.", false);
          return;
        }

        const summary = commitShort
          ? `Успішно: опубліковано ${mergedBranches} карток. 1 деплой запущено. Коміт ${commitShort}.`
          : `Успішно: опубліковано ${mergedBranches} карток. 1 деплой запущено.`;

        setStatus(summary, false);
      } catch (error) {
        setStatus(
          `Помилка мережі: ${error instanceof Error ? error.message : String(error)}`,
          true
        );
      } finally {
        state.running = false;
        setButtonLoading(false);
      }
    });
  }

  async function readJsonSafe(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  function setButtonLoading(loading) {
    if (!refs.publishButton) {
      return;
    }

    refs.publishButton.disabled = loading;
    refs.publishButton.textContent = loading ? "Публікація..." : "Опублікувати все";
  }

  function setStatus(message, isError) {
    if (!refs.status) {
      return;
    }

    refs.status.textContent = message;
    refs.status.dataset.state = isError ? "error" : "ok";
  }

  function setupIdentityRedirect() {
    if (!window.netlifyIdentity || typeof window.netlifyIdentity.on !== "function") {
      return;
    }

    window.netlifyIdentity.on("init", (user) => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          window.location.href = "/admin/index.html";
        });
      }
    });
  }

  async function ensureCmsInitialized() {
    const ready = await waitFor(
      () => window.CMS && typeof window.CMS.init === "function",
      10_000,
      100
    );

    if (!ready) {
      throw new Error("Decap CMS script is not available");
    }

    if (!window.__fmCmsInited) {
      window.__fmCmsInited = true;
      window.CMS.init({ load_config_file: true });
    }
  }

  async function waitFor(predicate, timeoutMs, stepMs) {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeoutMs) {
      if (predicate()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, stepMs));
    }

    return false;
  }
})();
