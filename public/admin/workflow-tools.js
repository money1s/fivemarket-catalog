(function initFmWorkflowTools() {
  "use strict";

  if (window.__fmToolsInited) {
    return;
  }
  window.__fmToolsInited = true;

  const TOOLS_VERSION = "2026-02-15-1";
  const STORAGE_KEY_HOOK = "fm_netlify_build_hook";

  const ROUTE_WORKFLOW = "#/workflow";
  const PER_ITEM_TIMEOUT_MS = 30_000;
  const BATCH_TIMEOUT_MS = 10 * 60_000;
  const MAX_EDITOR_OPEN_RETRY = 1;
  const MAX_CONFIRM_INTERACTIONS = 2;

  const STATE_LABELS = {
    draft: "Чорновик",
    ready: "Готові до деплою/публікації",
    published: "Опубліковані",
  };

  const PUBLISH_TEXT_PATTERNS = [
    "опублікувати запис",
    "опублікувати",
    "publish entry",
    "publish",
  ];

  const CONFIRM_TEXT_PATTERNS = ["опублікувати", "publish", "підтвердити", "confirm"];
  const SUCCESS_TEXT_PATTERNS = [
    "published",
    "опубліковано",
    "успішно",
    "success",
    "saved",
  ];

  const READY_HEADER_PATTERNS = ["ready", "готові", "готово"];

  const state = {
    running: false,
    stopRequested: false,
    processedIds: new Set(),
    logs: [],
    readyEntries: [],
    progressDone: 0,
    progressTotal: 0,
    currentItem: "-",
    publishedSuccessCount: 0,
    publishEventCount: 0,
  };

  const refs = createPanel();
  bindUiActions();
  bootstrap().catch((error) => {
    setStatus(`Помилка ініціалізації: ${error instanceof Error ? error.message : String(error)}`);
  });

  async function bootstrap() {
    refs.version.textContent = `Tools v=${TOOLS_VERSION}`;
    refs.stateMap.textContent = `${STATE_LABELS.draft} / ${STATE_LABELS.ready} / ${STATE_LABELS.published}`;

    loadHookFromStorage();
    setupIdentityRedirect();
    await ensureCmsInitialized();
    bindCmsEvents();
    await runScan({ announce: true });
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.id = "fm-workflow-tools";
    panel.className = "fm-tools";
    panel.innerHTML = `
      <h3 class="fm-tools__title">
        <span>Workflow helper</span>
        <span class="fm-tools__version" data-version></span>
      </h3>
      <div class="fm-tools__stats">
        <div><b>Статуси:</b> <span data-state-map></span></div>
        <div><b>READY знайдено:</b> <span data-ready-count>0</span></div>
      </div>

      <div class="fm-tools__grid">
        <button type="button" class="fm-tools__button fm-tools__button--secondary" data-scan>
          Сканувати / Оновити
        </button>
        <button type="button" class="fm-tools__button fm-tools__button--secondary" data-publish>
          Опублікувати зараз
        </button>
        <button type="button" class="fm-tools__button fm-tools__button--primary" data-deploy>
          1 деплой
        </button>
        <button type="button" class="fm-tools__button fm-tools__button--danger" data-stop disabled>
          Стоп
        </button>
      </div>

      <div class="fm-tools__hook">
        <label class="fm-tools__label" for="fm-hook-input">Netlify Build Hook URL</label>
        <div class="fm-tools__hook-row">
          <input id="fm-hook-input" class="fm-tools__input" type="password" autocomplete="off" data-hook-input />
          <button type="button" class="fm-tools__button fm-tools__button--secondary" data-toggle-hook>Показати</button>
        </div>
        <div class="fm-tools__hook-actions">
          <button type="button" class="fm-tools__button fm-tools__button--secondary" data-hook-save>Зберегти</button>
          <button type="button" class="fm-tools__button fm-tools__button--secondary" data-hook-clear>Очистити</button>
        </div>
        <p class="fm-tools__note">Build hook URL є секретом. Зберігання у браузері менш безпечне.</p>
      </div>

      <div class="fm-tools__status" data-status>Готово до сканування.</div>
      <div class="fm-tools__progress" data-progress>Прогрес: 0/0 · Поточний запис: -</div>

      <div class="fm-tools__list">
        <p class="fm-tools__list-title">Dry-run список (буде опубліковано):</p>
        <ul class="fm-tools__items" data-dry-list>
          <li class="fm-tools__muted">Список порожній.</li>
        </ul>
      </div>

      <div class="fm-tools__logs">
        <p class="fm-tools__logs-title">Лог:</p>
        <ul class="fm-tools__log-items" data-log-list>
          <li class="fm-tools__muted">Подій поки немає.</li>
        </ul>
      </div>
    `;

    document.body.appendChild(panel);

    return {
      panel,
      version: panel.querySelector("[data-version]"),
      stateMap: panel.querySelector("[data-state-map]"),
      readyCount: panel.querySelector("[data-ready-count]"),
      status: panel.querySelector("[data-status]"),
      progress: panel.querySelector("[data-progress]"),
      dryList: panel.querySelector("[data-dry-list]"),
      logList: panel.querySelector("[data-log-list]"),
      scanBtn: panel.querySelector("[data-scan]"),
      publishBtn: panel.querySelector("[data-publish]"),
      deployBtn: panel.querySelector("[data-deploy]"),
      stopBtn: panel.querySelector("[data-stop]"),
      hookInput: panel.querySelector("[data-hook-input]"),
      hookSaveBtn: panel.querySelector("[data-hook-save]"),
      hookClearBtn: panel.querySelector("[data-hook-clear]"),
      hookToggleBtn: panel.querySelector("[data-toggle-hook]"),
    };
  }

  function bindUiActions() {
    refs.scanBtn?.addEventListener("click", async () => {
      if (state.running) {
        return;
      }
      await runScan({ announce: true });
    });

    refs.publishBtn?.addEventListener("click", async () => {
      if (state.running) {
        return;
      }
      await runPublishBatch({ triggerDeploy: false });
    });

    refs.deployBtn?.addEventListener("click", async () => {
      if (state.running) {
        return;
      }
      await runPublishBatch({ triggerDeploy: true });
    });

    refs.stopBtn?.addEventListener("click", () => {
      if (!state.running) {
        return;
      }
      state.stopRequested = true;
      setStatus("Зупинка після поточного кроку...");
    });

    refs.hookSaveBtn?.addEventListener("click", () => {
      const value = (refs.hookInput?.value || "").trim();
      if (!value) {
        localStorage.removeItem(STORAGE_KEY_HOOK);
        setStatus("Build hook URL очищено.");
        return;
      }
      localStorage.setItem(STORAGE_KEY_HOOK, value);
      setStatus("Build hook URL збережено локально.");
    });

    refs.hookClearBtn?.addEventListener("click", () => {
      if (refs.hookInput) {
        refs.hookInput.value = "";
      }
      localStorage.removeItem(STORAGE_KEY_HOOK);
      setStatus("Build hook URL очищено.");
    });

    refs.hookToggleBtn?.addEventListener("click", () => {
      if (!refs.hookInput) {
        return;
      }
      const showing = refs.hookInput.type === "text";
      refs.hookInput.type = showing ? "password" : "text";
      refs.hookToggleBtn.textContent = showing ? "Показати" : "Сховати";
    });
  }

  function setButtonsRunning(isRunning) {
    state.running = isRunning;
    refs.scanBtn.disabled = isRunning;
    refs.publishBtn.disabled = isRunning;
    refs.deployBtn.disabled = isRunning;
    refs.hookSaveBtn.disabled = isRunning;
    refs.hookClearBtn.disabled = isRunning;
    refs.hookToggleBtn.disabled = isRunning;
    refs.stopBtn.disabled = !isRunning;
  }

  function setStatus(message) {
    if (refs.status) {
      refs.status.textContent = message;
    }
  }

  function setProgress(done, total, current) {
    if (refs.progress) {
      refs.progress.textContent = `Прогрес: ${done}/${total} · Поточний запис: ${current || "-"}`;
    }
  }

  function renderDryList(entries) {
    if (!refs.dryList) {
      return;
    }

    refs.dryList.innerHTML = "";
    if (!entries.length) {
      const li = document.createElement("li");
      li.className = "fm-tools__muted";
      li.textContent = "Список порожній.";
      refs.dryList.appendChild(li);
      return;
    }

    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.title} · ${entry.slug}`;
      refs.dryList.appendChild(li);
    });
  }

  function addLog(ok, text) {
    state.logs.push({ ok, text, time: new Date().toISOString() });
    if (state.logs.length > 120) {
      state.logs.shift();
    }
    renderLogs();
  }

  function clearLogs() {
    state.logs = [];
    renderLogs();
  }

  function renderLogs() {
    if (!refs.logList) {
      return;
    }

    refs.logList.innerHTML = "";
    if (!state.logs.length) {
      const li = document.createElement("li");
      li.className = "fm-tools__muted";
      li.textContent = "Подій поки немає.";
      refs.logList.appendChild(li);
      return;
    }

    state.logs.forEach((entry) => {
      const li = document.createElement("li");
      li.className = entry.ok ? "fm-tools__log--ok" : "fm-tools__log--fail";
      li.textContent = `${entry.ok ? "✅" : "❌"} ${entry.text}`;
      refs.logList.appendChild(li);
    });

    refs.logList.scrollTop = refs.logList.scrollHeight;
  }

  function loadHookFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY_HOOK) || "";
    if (refs.hookInput) {
      refs.hookInput.value = stored;
    }
  }

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function waitFor(check, timeoutMs, stepMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (check()) {
        return true;
      }
      await sleep(stepMs);
    }
    return false;
  }

  function isVisibleElement(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") {
      return false;
    }
    return element.offsetParent !== null || style.position === "fixed";
  }

  function isWorkflowRoute() {
    return window.location.hash.startsWith(ROUTE_WORKFLOW);
  }

  async function ensureWorkflowRoute() {
    if (!isWorkflowRoute()) {
      window.location.hash = ROUTE_WORKFLOW;
    }

    await waitFor(() => window.location.hash.startsWith(ROUTE_WORKFLOW), 2500, 80);
    await waitFor(() => document.querySelector("[data-rbd-droppable-id]"), 8000, 160);
  }

  function findColumnRootFromDroppable(droppable) {
    let node = droppable.parentElement;
    while (node && node !== document.body) {
      if (typeof node.querySelectorAll !== "function") {
        node = node.parentElement;
        continue;
      }

      const ownDroppables = node.querySelectorAll("[data-rbd-droppable-id]");
      if (ownDroppables.length === 1) {
        const parent = node.parentElement;
        if (!parent) {
          return node;
        }

        const siblingColumns = Array.from(parent.children).filter(
          (child) =>
            child instanceof HTMLElement &&
            child.querySelector("[data-rbd-droppable-id]")
        );

        if (siblingColumns.length >= 2) {
          return node;
        }
      }

      node = node.parentElement;
    }

    return droppable.parentElement || droppable;
  }

  function collectBoardDroppables() {
    return Array.from(document.querySelectorAll("[data-rbd-droppable-id]"));
  }

  function findReadyColumnByHeaderFallback() {
    const droppables = collectBoardDroppables();
    const roots = [];
    const seen = new Set();

    droppables.forEach((droppable) => {
      const root = findColumnRootFromDroppable(droppable);
      if (!root || seen.has(root)) {
        return;
      }
      seen.add(root);
      roots.push(root);
    });

    const match = roots.find((root) => {
      const headingCandidates = Array.from(
        root.querySelectorAll("h1,h2,h3,h4,[role='heading'],strong,span,p,div")
      );

      return headingCandidates.some((candidate) => {
        if (!(candidate instanceof HTMLElement)) {
          return false;
        }

        if (candidate.closest("[data-rbd-draggable-id]")) {
          return false;
        }

        const text = normalize(candidate.textContent || "");
        if (!text || text.length > 80) {
          return false;
        }

        return READY_HEADER_PATTERNS.some((pattern) => text.includes(pattern));
      });
    });

    if (!match) {
      return null;
    }

    const nestedDroppables = Array.from(match.querySelectorAll("[data-rbd-droppable-id]"));
    if (nestedDroppables.length) {
      return nestedDroppables[0];
    }

    return match;
  }

  function findReadyColumn() {
    const exact = document.querySelector('[data-rbd-droppable-id="ready"]');
    if (exact) {
      return { element: exact, source: "exact" };
    }

    const partial = collectBoardDroppables().find((element) => {
      const value = normalize(element.getAttribute("data-rbd-droppable-id") || "");
      return value.includes("ready");
    });

    if (partial) {
      return { element: partial, source: "partial" };
    }

    const headerFallback = findReadyColumnByHeaderFallback();
    if (headerFallback) {
      return { element: headerFallback, source: "header" };
    }

    return null;
  }

  function textFromCard(card) {
    const lines = String(card.innerText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line.length >= 2);

    return lines[0] || "Без назви";
  }

  function slugFromDraggableId(draggableId) {
    const normalized = String(draggableId || "").trim();
    const match = normalized.match(/entries\/(.+)$/i);
    const raw = match ? match[1] : normalized;
    return raw
      .split("/")
      .pop()
      .replace(/\?.*$/, "")
      .replace(/#.*/, "")
      .slice(0, 80);
  }

  function scanReadyEntries() {
    const found = findReadyColumn();
    if (!found) {
      return {
        ok: false,
        error: "Could not locate Ready column",
        entries: [],
        source: "none",
      };
    }

    const cardNodes = Array.from(found.element.querySelectorAll("[data-rbd-draggable-id]"));
    const seen = new Set();
    const entries = [];

    cardNodes.forEach((cardNode) => {
      const draggableId = String(cardNode.getAttribute("data-rbd-draggable-id") || "").trim();
      if (!draggableId || seen.has(draggableId)) {
        return;
      }

      seen.add(draggableId);
      entries.push({
        id: draggableId,
        slug: slugFromDraggableId(draggableId),
        title: textFromCard(cardNode),
        element: cardNode,
      });
    });

    return {
      ok: true,
      error: "",
      source: found.source,
      entries,
    };
  }

  function updateScanUi(scanResult) {
    const readyCount = scanResult.ok ? scanResult.entries.length : 0;
    state.readyEntries = scanResult.ok ? scanResult.entries : [];

    if (refs.readyCount) {
      refs.readyCount.textContent = String(readyCount);
    }

    renderDryList(state.readyEntries);
  }

  async function runScan(options) {
    const announce = options && options.announce;
    await ensureWorkflowRoute();

    const scanResult = scanReadyEntries();
    updateScanUi(scanResult);

    if (!scanResult.ok) {
      setStatus(scanResult.error);
      return scanResult;
    }

    if (announce) {
      setStatus(`Сканування завершено. READY: ${scanResult.entries.length} (${scanResult.source}).`);
    }

    return scanResult;
  }

  function inToolsPanel(node) {
    return node instanceof HTMLElement && !!node.closest("#fm-workflow-tools");
  }

  function collectVisibleButtons() {
    return Array.from(document.querySelectorAll("button")).filter(
      (button) => button instanceof HTMLButtonElement && isVisibleElement(button) && !inToolsPanel(button)
    );
  }

  function buttonMatches(button, patterns) {
    const text = normalize(button.textContent || "");
    const ariaLabel = normalize(button.getAttribute("aria-label") || "");
    const combined = `${text} ${ariaLabel}`;
    return patterns.some((pattern) => combined.includes(pattern));
  }

  function findPublishButton() {
    return collectVisibleButtons().find((button) => {
      if (!buttonMatches(button, PUBLISH_TEXT_PATTERNS)) {
        return false;
      }

      const text = normalize(button.textContent || "");
      if (text.includes("зараз") || text.includes("now")) {
        return false;
      }

      return true;
    }) || null;
  }

  function findConfirmButtonInDialog() {
    const dialogs = Array.from(
      document.querySelectorAll("[role='dialog'], [aria-modal='true'], .ReactModalPortal")
    ).filter((node) => isVisibleElement(node));

    for (const dialog of dialogs) {
      const buttons = Array.from(dialog.querySelectorAll("button")).filter(
        (button) => button instanceof HTMLButtonElement && isVisibleElement(button)
      );

      const confirmButton = buttons.find((button) => buttonMatches(button, CONFIRM_TEXT_PATTERNS));
      if (confirmButton) {
        return confirmButton;
      }
    }

    return null;
  }

  function findSuccessSignal() {
    const nodes = Array.from(
      document.querySelectorAll("[role='alert'], [aria-live='polite'], [aria-live='assertive'], .Toastify__toast")
    );

    return nodes.some((node) => {
      if (!(node instanceof HTMLElement) || !isVisibleElement(node)) {
        return false;
      }
      const text = normalize(node.textContent || "");
      return SUCCESS_TEXT_PATTERNS.some((pattern) => text.includes(pattern));
    });
  }

  function clickElement(target) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }

  function isEditorRoute() {
    const hash = window.location.hash || "";
    return hash.includes("/entries/");
  }

  async function openEditorForEntry(entryId) {
    await ensureWorkflowRoute();

    const freshScan = scanReadyEntries();
    if (!freshScan.ok) {
      return { ok: false, error: freshScan.error };
    }

    const entry = freshScan.entries.find((item) => item.id === entryId);
    if (!entry || !(entry.element instanceof HTMLElement)) {
      return { ok: false, error: "Картку не знайдено у READY" };
    }

    const target =
      entry.element.querySelector("button, a, [role='button']") || entry.element;

    entry.element.scrollIntoView({ block: "center" });
    clickElement(target);

    const opened = await waitFor(() => {
      if (state.stopRequested) {
        return true;
      }
      return isEditorRoute() || !!findPublishButton();
    }, 7000, 140);

    if (!opened || state.stopRequested) {
      return { ok: false, error: "Редактор не відкрився" };
    }

    return { ok: true };
  }

  async function waitForPublishResult(entry, baselineEventCount, startedAt) {
    let switchedToWorkflow = false;

    while (Date.now() - startedAt < PER_ITEM_TIMEOUT_MS) {
      if (state.stopRequested) {
        return { ok: false, error: "Stopped by user" };
      }

      if (state.publishEventCount > baselineEventCount) {
        return { ok: true, reason: "postPublish" };
      }

      if (findSuccessSignal()) {
        return { ok: true, reason: "toast" };
      }

      if (!switchedToWorkflow && Date.now() - startedAt > 3500) {
        window.location.hash = ROUTE_WORKFLOW;
        switchedToWorkflow = true;
      }

      if (isWorkflowRoute()) {
        const scan = scanReadyEntries();
        if (scan.ok && !scan.entries.some((item) => item.id === entry.id)) {
          return { ok: true, reason: "removed-from-ready" };
        }
      }

      await sleep(220);
    }

    await ensureWorkflowRoute();
    const finalScan = scanReadyEntries();
    if (!finalScan.ok || !finalScan.entries.some((item) => item.id === entry.id)) {
      return { ok: true, reason: "removed-after-timeout-check" };
    }

    return { ok: false, error: "timeout" };
  }

  async function publishSingleEntry(entry) {
    const startedAt = Date.now();
    let openAttempts = 0;

    while (openAttempts <= MAX_EDITOR_OPEN_RETRY) {
      const opened = await openEditorForEntry(entry.id);
      if (opened.ok) {
        break;
      }

      openAttempts += 1;
      if (openAttempts > MAX_EDITOR_OPEN_RETRY) {
        return { ok: false, error: opened.error || "Не вдалося відкрити редактор" };
      }
    }

    const publishButton = findPublishButton();
    if (!publishButton) {
      return { ok: false, error: "Кнопку Publish не знайдено" };
    }

    const baselineEventCount = state.publishEventCount;
    clickElement(publishButton);
    await sleep(220);

    let confirmInteractions = 0;
    while (confirmInteractions < MAX_CONFIRM_INTERACTIONS) {
      const confirmButton = findConfirmButtonInDialog();
      if (!confirmButton) {
        break;
      }

      clickElement(confirmButton);
      confirmInteractions += 1;
      await sleep(220);
    }

    if (findConfirmButtonInDialog()) {
      return { ok: false, error: "loop guard: too many confirmations" };
    }

    return waitForPublishResult(entry, baselineEventCount, startedAt);
  }

  async function runPublishBatch(options) {
    const triggerDeploy = !!(options && options.triggerDeploy);

    if (state.running) {
      return;
    }

    setButtonsRunning(true);
    clearLogs();
    state.stopRequested = false;
    state.processedIds = new Set();
    state.progressDone = 0;
    state.progressTotal = 0;
    state.currentItem = "-";
    state.publishedSuccessCount = 0;
    setProgress(state.progressDone, state.progressTotal, state.currentItem);

    const batchStartedAt = Date.now();
    let initialReadyCount = 0;

    try {
      await ensureWorkflowRoute();
      const initialScan = scanReadyEntries();
      updateScanUi(initialScan);

      if (!initialScan.ok) {
        setStatus(initialScan.error);
        addLog(false, initialScan.error);
        return;
      }

      initialReadyCount = initialScan.entries.length;
      state.progressTotal = initialReadyCount;
      setProgress(state.progressDone, state.progressTotal, state.currentItem);

      if (initialReadyCount === 0) {
        const zeroMessage = triggerDeploy
          ? "No READY items. Deploy не запущено."
          : "No READY items.";
        setStatus(zeroMessage);
        addLog(false, zeroMessage);
        return;
      }

      setStatus(`Починаю публікацію ${initialReadyCount} запис(ів)...`);

      while (Date.now() - batchStartedAt < BATCH_TIMEOUT_MS) {
        if (state.stopRequested) {
          setStatus("Stopped by user.");
          addLog(false, "Stopped by user");
          break;
        }

        const scan = scanReadyEntries();
        updateScanUi(scan);

        if (!scan.ok) {
          setStatus(scan.error);
          addLog(false, scan.error);
          break;
        }

        const candidates = scan.entries.filter((entry) => !state.processedIds.has(entry.id));
        state.progressTotal = Math.max(state.progressTotal, state.progressDone + candidates.length);

        if (!candidates.length) {
          break;
        }

        const entry = candidates[0];
        state.currentItem = `${entry.title} (${entry.slug})`;
        setProgress(state.progressDone, state.progressTotal, state.currentItem);

        const result = await publishSingleEntry(entry);
        state.processedIds.add(entry.id);
        state.progressDone += 1;

        if (result.ok) {
          state.publishedSuccessCount += 1;
          addLog(true, `Опубліковано: ${entry.title} (${entry.slug}) [${result.reason}]`);
        } else {
          addLog(false, `Помилка: ${entry.title} (${entry.slug}) — ${result.error}`);
        }

        setProgress(state.progressDone, state.progressTotal, state.currentItem);
        await ensureWorkflowRoute();
      }

      if (Date.now() - batchStartedAt >= BATCH_TIMEOUT_MS) {
        setStatus("Batch timeout: процес зупинено.");
        addLog(false, "Batch timeout");
      }

      await runScan({ announce: false });

      if (triggerDeploy) {
        if (initialReadyCount === 0 || state.publishedSuccessCount === 0) {
          setStatus("No published changes; deploy not triggered.");
          addLog(false, "Deploy пропущено: немає опублікованих змін у цьому запуску.");
          return;
        }

        const hookUrl = (refs.hookInput?.value || "").trim();
        if (!hookUrl) {
          setStatus("Build hook URL не заданий. Deploy не запущено.");
          addLog(false, "Deploy не запущено: відсутній Build hook URL.");
          return;
        }

        setStatus("Тригерю deploy hook...");
        const deployResult = await triggerBuildHook(hookUrl);
        if (deployResult.ok) {
          setStatus("Deploy triggered.");
          addLog(true, "Deploy hook викликано (1 раз).");
        } else {
          setStatus(`Помилка deploy hook: ${deployResult.error}`);
          addLog(false, `Deploy hook помилка: ${deployResult.error}`);
        }
        return;
      }

      setStatus(`Готово: опубліковано ${state.publishedSuccessCount} запис(ів).`);
    } finally {
      state.currentItem = "-";
      setProgress(state.progressDone, state.progressTotal, state.currentItem);
      setButtonsRunning(false);
    }
  }

  async function triggerBuildHook(hookUrl) {
    try {
      await fetch(hookUrl, {
        method: "POST",
        mode: "no-cors",
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
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

  function bindCmsEvents() {
    if (window.__fmCmsPostPublishBound) {
      return;
    }

    if (!window.CMS || typeof window.CMS.registerEventListener !== "function") {
      return;
    }

    window.CMS.registerEventListener({
      name: "postPublish",
      handler: function postPublishHandler() {
        state.publishEventCount += 1;
      },
    });

    window.__fmCmsPostPublishBound = true;
  }
})();
