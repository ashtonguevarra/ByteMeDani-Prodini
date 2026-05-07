// ============================================
// ACTIVITY LOGGER - RENDERER PROCESS (UI)
// ============================================
// This file handles all UI interactions and display logic
// Responsibilities:
// - Display real-time activity tracking
// - Generate charts and analytics
// - Handle user interactions (buttons, modals, settings)
// - Communicate with main process via IPC
// ============================================
// ACTIVITY LOGGER - RENDERER PROCESS (UI)
// ============================================
// This file handles UI interactions, view switching, and activity display.
// ============================================

const logEl = document.getElementById("log");
const navBtns = document.querySelectorAll(".nav-btn");
const dateDisplay = document.getElementById("dateDisplay");
const takeBreakBtn = document.getElementById("takeBreakBtn");
const breakModal = document.getElementById("breakModal");
const confirmBreakBtn = document.getElementById("confirmBreakBtn");
const cancelBreakBtn = document.getElementById("cancelBreakBtn");
const activeBreakBar = document.getElementById("activeBreakBar");
const breakTimerDisplay = document.getElementById("breakTimerDisplay");
const endBreakBtn = document.getElementById("endBreakBtn");
const breakValueInput = document.getElementById("breakValueInput");
const breakUnitSelect = document.getElementById("breakUnit");
const resetBtn = document.getElementById("resetLog");
const logDiv = document.getElementById("log");
const toggleTrackingBtn = document.getElementById("toggleTrackingBtn");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const fontPlusModal = document.getElementById("fontPlusModal");
const fontMinusModal = document.getElementById("fontMinusModal");
const fontSizeDisplay = document.getElementById("fontSizeModal");
const modal = document.getElementById("colorModal");
const colorBtn = document.getElementById("colorPaletteBtn");
const closeBtn = document.querySelector(".close");
const applyColorsBtn = document.getElementById("applyColors");
const generateSummaryBtn = document.getElementById("generateSummaryBtn");
const overrideTargetSelect = document.getElementById("overrideTargetApp");
const useLastActiveAppBtn = document.getElementById("useLastActiveAppBtn");
const markProductiveBtn = document.getElementById("markProductiveBtn");
const markUnproductiveBtn = document.getElementById("markUnproductiveBtn");
const markRestBtn = document.getElementById("markRestBtn");
const markUnknownBtn = document.getElementById("markUnknownBtn");
const clearCurrentOverrideBtn = document.getElementById("clearCurrentOverrideBtn");
const appKeywordInput = document.getElementById("appKeywordInput");
const addProductiveKeywordBtn = document.getElementById("addProductiveKeywordBtn");
const addUnproductiveKeywordBtn = document.getElementById("addUnproductiveKeywordBtn");

let activityChart = null;
let weeklyChart = null;
let monthlyChart = null;
let weeklyChartFull = null;
let monthlyChartFull = null;

let breakActive = false;
let breakInterval = null;
let breakEndTime = null;

let currentSessionId = localStorage.getItem("currentSessionId");
let isTracking = false;
let lastTrackingStatus = null;
let currentFontSize = 100;

let customColors = {
  productive: "#4caf50",
  unproductive: "#f44336",
  rest: "#ff9800",
  unknown: "#9e9e9e",
  background: "#ffffff",
  text: "#000000"
};

let timeSpent = {
  productive: 0,
  unproductive: 0,
  rest: 0,
  unknown: 0
};

const CHART_CATEGORIES = ["productive", "unproductive", "rest"];

let weeklyData = {};
let monthlyData = {};
let lastEntry = null;
let lastTimestamp = null;
let currentWindowName = "";
let lastActiveAppName = "";
let lastActiveWindowTitle = "";
let overrideTargetApp = "";
let sessionOverrideRules = {};
let seenAppNames = new Set();

const CLASSIFICATION_RULE_STORAGE_KEY = "classificationRulesV1";
const SESSION_OVERRIDE_STORAGE_KEY = "sessionOverrideRulesV1";

const DEFAULT_PRODUCTIVE_APPS = [
  "vscode", "visual studio", "cursor", "intellij", "pycharm",
  "terminal", "notion", "figma", "excel", "word", "code", "brave", "chrome", "firefox",
  "github", "gitlab", "slack", "teams", "zoom", "meet", "gmail", "outlook", "drive",
  "docs", "sheets", "slides", "postman", "insomnia", "jupyter", "android studio",
  "xcode", "datagrip", "webstorm", "sublime text", "obsidian",
  "canva", "trello", "asana", "microsoft planner", "planner", "discord"
];

const DEFAULT_UNPRODUCTIVE_APPS = [
  "youtube", "twitter", "facebook", "instagram", "reddit",
  "twitch", "tiktok", "netflix", "hulu", "snapchat", "threads", "pinterest", "messenger",
  "x", "kick", "9gag", "bilibili", "temu", "shopee", "tiktok shop"
];

const restApps = ["calendar", "reminders", "clock", "alarm", "settings", "spotify", "music", "apple music"];

let productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
let unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];

const DEFAULT_CLASSIFICATION_RULES = [
  ...DEFAULT_PRODUCTIVE_APPS.map(keyword => ({ keyword, classification: "productive", source: "built-in" })),
  ...DEFAULT_UNPRODUCTIVE_APPS.map(keyword => ({ keyword, classification: "unproductive", source: "built-in" })),
  ...[
    "youtube tutorial",
    "youtube how to",
    "youtube course",
    "youtube lecture",
    "youtube guide",
    "reddit tutorial",
    "reddit how to",
    "reddit guide",
    "reddit walkthrough",
    "documentation",
    "docs",
    "guide",
    "how to",
    "tutorial",
    "lecture",
    "course",
    "webinar"
  ].map(keyword => ({ keyword, classification: "productive", source: "built-in" }))
];

let classificationRules = loadClassificationRules();
refreshDerivedAppLists();
loadSessionOverrides();

function getEl(id) {
  return document.getElementById(id);
}

function normalizeKeyword(text) {
  return String(text || "").trim().toLowerCase();
}

function isTrackerWindow(windowTitle) {
  const value = normalizeKeyword(windowTitle);
  return value.includes("activity tracker dashboard") || value.includes("logger-app") || value.startsWith("electron");
}

function loadClassificationRules() {
  try {
    const raw = localStorage.getItem(CLASSIFICATION_RULE_STORAGE_KEY);
    if (!raw) return DEFAULT_CLASSIFICATION_RULES.map((rule, index) => ({ id: `default-${index}`, ...rule }));

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Rules must be an array");

    return parsed
      .filter(rule => rule && rule.keyword && rule.classification)
      .map((rule, index) => ({
        id: rule.id || `rule-${index}-${Date.now()}`,
        keyword: String(rule.keyword),
        classification: rule.classification,
        source: rule.source || "custom"
      }));
  } catch (err) {
    console.warn("Falling back to default classification rules:", err && err.message);
    return DEFAULT_CLASSIFICATION_RULES.map((rule, index) => ({ id: `default-${index}`, ...rule }));
  }
}

function saveClassificationRules() {
  localStorage.setItem(CLASSIFICATION_RULE_STORAGE_KEY, JSON.stringify(classificationRules));
}

function refreshDerivedAppLists() {
  productiveApps = classificationRules
    .filter(rule => rule.classification === "productive")
    .map(rule => normalizeKeyword(rule.keyword))
    .filter(Boolean);

  unproductiveApps = classificationRules
    .filter(rule => rule.classification === "unproductive")
    .map(rule => normalizeKeyword(rule.keyword))
    .filter(Boolean);
}

function renderOverrideTargetOptions() {
  const select = getEl("overrideTargetApp");
  if (!select) return;

  const options = Array.from(seenAppNames)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const currentValue = select.value || overrideTargetApp;
  select.innerHTML = `<option value="">Select an app</option>` + options.map(name => `<option value="${name}">${name}</option>`).join("");

  if (currentValue && options.includes(currentValue)) {
    select.value = currentValue;
  }
}

function getSelectedOverrideTarget() {
  const select = getEl("overrideTargetApp");
  return (select && select.value) || overrideTargetApp || lastActiveAppName || "";
}

function updateOverrideStatus() {
  const currentLabel = getEl("overrideCurrentApp");
  const statusLabel = getEl("overrideStatus");
  const target = getSelectedOverrideTarget();
  const rule = target ? sessionOverrideRules[normalizeKeyword(target)] : null;

  if (currentLabel) {
    currentLabel.textContent = target || "No target selected";
  }

  if (statusLabel) {
    if (!target) {
      statusLabel.textContent = "No manual override for this app.";
    } else if (rule) {
      statusLabel.textContent = `${target} is currently marked as ${rule}.`;
    } else {
      statusLabel.textContent = `No manual override set for ${target}.`;
    }
  }
}

function persistSessionOverrides() {
  localStorage.setItem(SESSION_OVERRIDE_STORAGE_KEY, JSON.stringify(sessionOverrideRules));
}

function clearSessionOverrides() {
  sessionOverrideRules = {};
  overrideTargetApp = "";
  seenAppNames = new Set();
  localStorage.removeItem(SESSION_OVERRIDE_STORAGE_KEY);
  renderOverrideTargetOptions();
  updateOverrideStatus();
}

function loadSessionOverrides() {
  try {
    const raw = localStorage.getItem(SESSION_OVERRIDE_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      sessionOverrideRules = parsed;
    }
  } catch (err) {
    console.warn("Failed to load session overrides:", err && err.message);
  }
}

function normalizeWindowActivity(windowTitle) {
  const rawTitle = String(windowTitle || "").trim();
  if (!rawTitle) {
    return { appName: "Unknown", tabName: "Unknown", titleForRules: "", isTracker: false };
  }

  if (isTrackerWindow(rawTitle)) {
    return {
      appName: "Tracker",
      tabName: "Tracker Dashboard",
      titleForRules: rawTitle,
      isTracker: true
    };
  }

  let appName = rawTitle;
  let tabName = rawTitle;

  if (rawTitle.includes(" - ")) {
    const parts = rawTitle.split(" - ");
    appName = parts[0];
    tabName = parts.slice(1).join(" - ");
  } else if (rawTitle.includes(" | ")) {
    const parts = rawTitle.split(" | ");
    appName = parts[parts.length - 1];
    tabName = parts.slice(0, -1).join(" | ");
  }

  appName = appName.replace(/\.exe$/i, "").trim();
  tabName = tabName.trim();

  if (!tabName) tabName = appName;
  if (!appName) appName = tabName;

  if (tabName.length > 50) tabName = `${tabName.slice(0, 47)}...`;
  if (appName.length > 25) appName = `${appName.slice(0, 22)}...`;

  return { appName, tabName, titleForRules: rawTitle, isTracker: false };
}

function renderAppRules() {
  const list = getEl("appRulesList");
  const empty = getEl("appRulesEmpty");
  if (!list) return;

  list.innerHTML = "";

  if (!classificationRules.length) {
    if (empty) empty.style.display = "block";
    return;
  }

  if (empty) empty.style.display = "none";

  classificationRules.forEach(rule => {
    const row = document.createElement("div");
    row.className = "app-rule-row";
    row.dataset.ruleId = rule.id;

    row.innerHTML = `
      <input class="app-rule-name" type="text" value="${rule.keyword.replace(/"/g, '&quot;')}">
      <div class="app-rule-check"><input type="radio" name="rule-${rule.id}" value="productive" ${rule.classification === "productive" ? "checked" : ""}></div>
      <div class="app-rule-check"><input type="radio" name="rule-${rule.id}" value="unproductive" ${rule.classification === "unproductive" ? "checked" : ""}></div>
      <button class="app-rule-remove" type="button">Remove</button>
    `;

    const nameInput = row.querySelector(".app-rule-name");
    const radios = row.querySelectorAll('input[type="radio"]');
    const removeBtn = row.querySelector(".app-rule-remove");

    nameInput.addEventListener("change", () => {
      const nextKeyword = normalizeKeyword(nameInput.value);
      if (!nextKeyword) {
        nameInput.value = rule.keyword;
        return;
      }

      rule.keyword = nextKeyword;
      saveClassificationRules();
      refreshDerivedAppLists();
    });

    radios.forEach(radio => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        rule.classification = radio.value;
        saveClassificationRules();
        refreshDerivedAppLists();
      });
    });

    removeBtn.addEventListener("click", () => {
      classificationRules = classificationRules.filter(item => item.id !== rule.id);
      saveClassificationRules();
      refreshDerivedAppLists();
      renderAppRules();
    });

    list.appendChild(row);
  });
}

function addClassificationRule(keyword, classification) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return;

  classificationRules.unshift({
    id: `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    keyword: normalized,
    classification,
    source: "custom"
  });

  saveClassificationRules();
  refreshDerivedAppLists();
  renderAppRules();
}

function setSessionOverride(targetApp, classification) {
  const target = normalizeKeyword(targetApp);
  if (!target) return;

  sessionOverrideRules[target] = classification;
  overrideTargetApp = targetApp;
  persistSessionOverrides();
  updateOverrideStatus();
}

function clearSessionOverride(targetApp) {
  const target = normalizeKeyword(targetApp);
  if (!target) return;

  delete sessionOverrideRules[target];
  persistSessionOverrides();
  updateOverrideStatus();
}

function updateDateDisplay() {
  if (!dateDisplay) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  dateDisplay.textContent = `${dateStr} • ${timeStr}`;
}

function updateFontSize() {
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = `${currentFontSize}%`;
  }
  document.documentElement.style.fontSize = `${(14 * currentFontSize) / 100}px`;
}

function openColorModal() {
  if (modal) modal.style.display = "block";
}

function closeColorModal() {
  if (modal) modal.style.display = "none";
}

function stopBreak() {
  breakActive = false;

  if (breakInterval) {
    clearInterval(breakInterval);
    breakInterval = null;
  }

  if (activeBreakBar) {
    activeBreakBar.style.display = "none";
  }
}

function updateBreakTimer() {
  if (!breakActive || !breakEndTime) return;

  const timeLeft = breakEndTime - Date.now();
  if (timeLeft <= 0) {
    stopBreak();
    return;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  if (breakTimerDisplay) {
    breakTimerDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
}

function addLogHeader() {
  if (!logEl || document.querySelector(".log-header")) return;

  const header = document.createElement("div");
  header.className = "log-header";
  header.innerHTML = `
    <div class="log-header-app">Tab / Window Title</div>
    <div class="log-header-tab">App</div>
    <div class="log-header-time">Time</div>
  `;
  logEl.appendChild(header);
}

function extractAppAndTitle(windowTitle) {
  let appName = windowTitle;
  let tabName = windowTitle;

  if (windowTitle.includes(" - ")) {
    const parts = windowTitle.split(" - ");
    appName = parts[0];
    tabName = parts.slice(1).join(" - ");
  } else if (windowTitle.includes(" | ")) {
    const parts = windowTitle.split(" | ");
    appName = parts[parts.length - 1];
    tabName = parts.slice(0, -1).join(" | ");
  }

  appName = appName.replace(/\.exe$/i, "").trim();
  if (!tabName) tabName = appName;
  if (!appName) appName = tabName;

  if (tabName.length > 50) tabName = `${tabName.slice(0, 47)}...`;
  if (appName.length > 25) appName = `${appName.slice(0, 22)}...`;

  return { tabName, appName };
}

function categorizeApp(appName) {
  const normalized = normalizeWindowActivity(appName);
  const haystack = [normalized.appName, normalized.tabName, normalized.titleForRules]
    .map(normalizeKeyword)
    .filter(Boolean)
    .join(" ");

  if (normalized.isTracker || breakActive) return "rest";

  const override = sessionOverrideRules[normalizeKeyword(normalized.appName)];
  if (override) return override;

  const orderedRules = [...classificationRules].sort((a, b) => normalizeKeyword(b.keyword).length - normalizeKeyword(a.keyword).length);

  for (const rule of orderedRules) {
    const keyword = normalizeKeyword(rule.keyword);
    if (keyword && haystack.includes(keyword)) {
      return rule.classification;
    }
  }

  for (const app of productiveApps) if (haystack.includes(app)) return "productive";
  for (const app of unproductiveApps) if (haystack.includes(app)) return "unproductive";
  for (const app of restApps) if (haystack.includes(app)) return "rest";

  return "unknown";
}

async function startSession() {
  const res = await fetch("http://127.0.0.1:5000/sessions/start", { method: "POST" });
  const data = await res.json();
  currentSessionId = data.session_id;
  localStorage.setItem("currentSessionId", currentSessionId);
  clearSessionOverrides();
  loadSessions();
}

function clearDashboardActivity() {
  currentWindowName = "";
  lastActiveAppName = "";
  lastActiveWindowTitle = "";
  lastEntry = null;
  lastTimestamp = null;
  timeSpent = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
  weeklyData = {};
  monthlyData = {};
  seenAppNames = new Set();
  clearSessionOverrides();

  if (logEl) {
    logEl.innerHTML = "";
    addLogHeader();
  }

  if (activityChart) {
    activityChart.destroy();
    activityChart = null;
  }
  if (weeklyChart) {
    weeklyChart.destroy();
    weeklyChart = null;
  }
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (weeklyChartFull) {
    weeklyChartFull.destroy();
    weeklyChartFull = null;
  }
  if (monthlyChartFull) {
    monthlyChartFull.destroy();
    monthlyChartFull = null;
  }

  updateChart();
  updateLegend();
  updateWeeklyCharts();
  updateMonthlyCharts();
  updateWeeklyFullView();
  updateMonthlyFullView();
}

async function stopSession() {
  if (!currentSessionId) return;

  await fetch(`http://127.0.0.1:5000/sessions/${currentSessionId}/stop`, { method: "POST" });
  currentSessionId = null;
  localStorage.removeItem("currentSessionId");
  loadSessions();
  clearDashboardActivity();
}

async function saveLogToDatabase(windowTitle) {
  if (!currentSessionId) return;

  const extracted = normalizeWindowActivity(windowTitle);
  
  // Don't log the tracker window itself
  if (extracted.isTracker) return;

  await fetch("http://127.0.0.1:5000/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: Number(currentSessionId),
      app_name: extracted.appName,
      window_title: extracted.tabName || extracted.appName
    })
  });
}

async function loadSessions() {
  const historyLog = getEl("historyLog");
  if (!historyLog) return;

  try {
    const res = await fetch("http://127.0.0.1:5000/sessions");
    const sessions = await res.json();
    historyLog.innerHTML = "";

    if (!sessions.length) {
      historyLog.innerHTML = "<p>No sessions yet.</p>";
      return;
    }

    sessions.forEach(session => {
      const div = document.createElement("div");
      div.className = "session-card";

      const started = session.started_at ? new Date(session.started_at).toLocaleString() : "Unknown";
      const ended = session.ended_at ? new Date(session.ended_at).toLocaleString() : "Active";

      div.innerHTML = `
        <strong>Session ${session.id}</strong><br>
        <small>Started: ${started}</small><br>
        <small>Ended: ${ended}</small>
      `;

      div.addEventListener("click", () => loadSessionLogs(session.id));
      historyLog.appendChild(div);
    });
  } catch (err) {
    historyLog.innerHTML = "<p>Database not connected.</p>";
    console.error("Failed to load sessions:", err);
  }
}

async function loadSessionLogs(sessionId) {
  const historyLog = getEl("historyLog");
  if (!historyLog) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/sessions/${sessionId}/logs`);
    const logs = await res.json();
    historyLog.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to Sessions";
    backBtn.className = "back-btn";
    backBtn.addEventListener("click", loadSessions);
    historyLog.appendChild(backBtn);

    const title = document.createElement("h3");
    title.textContent = `Session ${sessionId}`;
    historyLog.appendChild(title);

    if (!logs.length) {
      const empty = document.createElement("p");
      empty.textContent = "No logs for this session.";
      historyLog.appendChild(empty);
      return;
    }

    logs.forEach(log => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = `
        <strong>${log.app_name}</strong><br>
        <span>${log.window_title}</span><br>
        <small>${new Date(log.timestamp).toLocaleString()}</small>
      `;
      historyLog.appendChild(div);
    });
  } catch (err) {
    historyLog.innerHTML = "<p>Failed to load session logs.</p>";
    console.error("Failed to load logs:", err);
  }
}

function addToLog(windowName, timestamp) {
  if (!logEl) return;

  const normalized = normalizeWindowActivity(windowName);
  
  // Don't add tracker window to visible log
  if (normalized.isTracker) return;

  const { tabName, appName } = normalized;
  const category = categorizeApp(windowName);
  const categoryColor = customColors[category] || customColors.unknown;
  const timeStr = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const div = document.createElement("div");
  div.className = "log-entry current";
  div.innerHTML = `
    <div class="log-app" title="${tabName}">
      <span class="category-circle" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${categoryColor};margin-right:8px;"></span>
      ${tabName}
    </div>
    <div class="log-tab" title="${appName}">${appName}</div>
    <span class="log-time">${timeStr}</span>
  `;

  if (logEl.children.length > 1) {
    logEl.insertBefore(div, logEl.children[1]);
  } else {
    logEl.appendChild(div);
  }

  while (logEl.children.length > 101) {
    logEl.removeChild(logEl.lastChild);
  }
}

function updateChartSize() {
  const canvas = getEl("activityChart");
  if (!canvas) return;

  const windowWidth = window.innerWidth;
  if (windowWidth < 900) {
    canvas.style.width = "200px";
    canvas.style.height = "200px";
  } else if (windowWidth < 1100) {
    canvas.style.width = "220px";
    canvas.style.height = "220px";
  } else {
    canvas.style.width = "250px";
    canvas.style.height = "250px";
  }
}

function updateChart() {
  const canvas = getEl("activityChart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  updateChartSize();

  const labels = ["Productive", "Unproductive", "Rest"];
  const data = CHART_CATEGORIES.map(category => timeSpent[category]);

  if (activityChart) {
    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = data;
    activityChart.data.datasets[0].backgroundColor = [customColors.productive, customColors.unproductive, customColors.rest];
    activityChart.update();
    return;
  }

  activityChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [customColors.productive, customColors.unproductive, customColors.rest],
        borderWidth: 1,
        radius: "90%"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } }
    }
  });
}

function updateLegend() {
  const legendContainer = getEl("chartLegend");
  if (!legendContainer) return;

  const formatTime = minutes => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  legendContainer.innerHTML = `
    <div class="legend-item"><div style="display:flex;align-items:center;"><div class="legend-color" style="background:${customColors.productive}"></div><span class="legend-label">Productive</span></div><span class="legend-time">${formatTime(timeSpent.productive)}</span></div>
    <div class="legend-item"><div style="display:flex;align-items:center;"><div class="legend-color" style="background:${customColors.unproductive}"></div><span class="legend-label">Unproductive</span></div><span class="legend-time">${formatTime(timeSpent.unproductive)}</span></div>
    <div class="legend-item"><div style="display:flex;align-items:center;"><div class="legend-color" style="background:${customColors.rest}"></div><span class="legend-label">Rest</span></div><span class="legend-time">${formatTime(timeSpent.rest)}</span></div>
  `;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  }
  return days;
}

function getLast4Weeks() {
  return ["Week 1", "Week 2", "Week 3", "Week 4"];
}

function buildStackedBarChart(canvasId, chartRef, labels, dataPoints, monthMode = false) {
  const canvas = getEl(canvasId);
  if (!canvas || typeof Chart === "undefined") return chartRef;

  const ctx = canvas.getContext("2d");
  if (chartRef) chartRef.destroy();

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Productive", data: dataPoints.map(d => d.productive), backgroundColor: customColors.productive, borderRadius: 4 },
        { label: "Unproductive", data: dataPoints.map(d => d.unproductive), backgroundColor: customColors.unproductive, borderRadius: 4 },
        { label: "Rest", data: dataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: monthMode ? {} : {
        legend: {
          position: "bottom",
          labels: { font: { size: 10 } }
        }
      }
    }
  });
}

function updateWeeklyCharts() {
  const last7Days = getLast7Days();
  const weeklyDataPoints = last7Days.map(day => ({
    day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0
  }));
  weeklyChart = buildStackedBarChart("weeklyChart", weeklyChart, last7Days, weeklyDataPoints, false);
}

function updateMonthlyCharts() {
  const weeks = getLast4Weeks();
  const monthlyDataPoints = weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0
  }));
  monthlyChart = buildStackedBarChart("monthlyChart", monthlyChart, weeks, monthlyDataPoints, false);
}

function updateWeeklyFullView() {
  const last7Days = getLast7Days();
  const weeklyDataPoints = last7Days.map(day => ({
    day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0
  }));
  weeklyChartFull = buildStackedBarChart("weeklyChartFull", weeklyChartFull, last7Days, weeklyDataPoints, true);
}

function updateMonthlyFullView() {
  const weeks = getLast4Weeks();
  const monthlyDataPoints = weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0
  }));
  monthlyChartFull = buildStackedBarChart("monthlyChartFull", monthlyChartFull, weeks, monthlyDataPoints, true);
}

function switchView(view) {
  navBtns.forEach(button => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const target = getEl(`${view}View`);
  if (target) target.classList.add("active");

  if (view === "weekly") updateWeeklyFullView();
  if (view === "monthly") updateMonthlyFullView();
  if (view === "history") loadSessions();
}

if (resetBtn && logDiv) {
  resetBtn.addEventListener("click", () => {
    const ok = confirm("Reset the current dashboard log?");
    if (!ok) return;

    clearDashboardActivity();
  });
}

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    sidebarToggle.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";
  });
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

if (takeBreakBtn && breakModal) {
  takeBreakBtn.addEventListener("click", () => {
    if (!isTracking) {
      alert("Session not started yet. Please start a session first before taking a break.");
      return;
    }

    breakModal.style.display = "block";
  });
}

if (cancelBreakBtn && breakModal) {
  cancelBreakBtn.addEventListener("click", () => {
    breakModal.style.display = "none";
  });
}

if (confirmBreakBtn) {
  confirmBreakBtn.addEventListener("click", () => {
    const raw = parseFloat(breakValueInput.value);
    const unit = (breakUnitSelect && breakUnitSelect.value) || "minutes";
    if (Number.isNaN(raw) || raw <= 0) {
      alert("Please enter a break duration greater than 0");
      return;
    }

    let minutes = raw;
    if (unit === "hours") minutes = Math.round(raw * 60);

    breakActive = true;
    breakEndTime = Date.now() + minutes * 60 * 1000;
    if (breakModal) breakModal.style.display = "none";
    if (activeBreakBar) activeBreakBar.style.display = "flex";

    if (breakInterval) clearInterval(breakInterval);
    breakInterval = setInterval(updateBreakTimer, 1000);
    updateBreakTimer();
  });
}

if (endBreakBtn) {
  endBreakBtn.addEventListener("click", stopBreak);
}

if (fontPlusModal) {
  fontPlusModal.addEventListener("click", () => {
    if (currentFontSize < 130) {
      currentFontSize += 10;
      updateFontSize();
    }
  });
}

if (fontMinusModal) {
  fontMinusModal.addEventListener("click", () => {
    if (currentFontSize > 70) {
      currentFontSize -= 10;
      updateFontSize();
    }
  });
}

if (colorBtn) colorBtn.addEventListener("click", openColorModal);
if (closeBtn) closeBtn.addEventListener("click", closeColorModal);

window.addEventListener("click", event => {
  if (event.target === modal) closeColorModal();
});

if (applyColorsBtn) {
  applyColorsBtn.addEventListener("click", () => {
    const productiveInput = getEl("productiveColor");
    const unproductiveInput = getEl("unproductiveColor");
    const restInput = getEl("restColor");
    const backgroundInput = getEl("bgColor");
    const textInput = getEl("textColor");

    if (productiveInput) customColors.productive = productiveInput.value;
    if (unproductiveInput) customColors.unproductive = unproductiveInput.value;
    if (restInput) customColors.rest = restInput.value;
    if (backgroundInput) customColors.background = backgroundInput.value;
    if (textInput) customColors.text = textInput.value;

    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.background = customColors.background;
      mainContent.style.color = customColors.text;
    }

    updateChart();
    updateLegend();
    updateWeeklyCharts();
    updateMonthlyCharts();
    updateWeeklyFullView();
    updateMonthlyFullView();
    closeColorModal();
  });
}

if (generateSummaryBtn) {
  generateSummaryBtn.addEventListener("click", () => {
    const summaryMessage = document.querySelector(".summary-message");
    if (!summaryMessage) return;

    summaryMessage.textContent = "Summary feature coming soon!";
    setTimeout(() => {
      summaryMessage.textContent = "Summary will appear here";
    }, 2000);
  });
}

if (overrideTargetSelect) {
  overrideTargetSelect.addEventListener("change", () => {
    overrideTargetApp = overrideTargetSelect.value;
    updateOverrideStatus();
  });
}

if (useLastActiveAppBtn) {
  useLastActiveAppBtn.addEventListener("click", () => {
    const target = lastActiveAppName || normalizeWindowActivity(lastActiveWindowTitle).appName;
    if (!target) {
      updateOverrideStatus();
      return;
    }

    overrideTargetApp = target;
    if (overrideTargetSelect) overrideTargetSelect.value = target;
    updateOverrideStatus();
  });
}

if (markProductiveBtn) {
  markProductiveBtn.addEventListener("click", () => {
    const target = getSelectedOverrideTarget();
    if (!target) return;
    setSessionOverride(target, "productive");
  });
}

if (markUnproductiveBtn) {
  markUnproductiveBtn.addEventListener("click", () => {
    const target = getSelectedOverrideTarget();
    if (!target) return;
    setSessionOverride(target, "unproductive");
  });
}

if (markRestBtn) {
  markRestBtn.addEventListener("click", () => {
    const target = getSelectedOverrideTarget();
    if (!target) return;
    setSessionOverride(target, "rest");
  });
}

if (markUnknownBtn) {
  markUnknownBtn.addEventListener("click", () => {
    const target = getSelectedOverrideTarget();
    if (!target) return;
    setSessionOverride(target, "unknown");
  });
}

if (clearCurrentOverrideBtn) {
  clearCurrentOverrideBtn.addEventListener("click", () => {
    const target = getSelectedOverrideTarget();
    if (!target) return;
    clearSessionOverride(target);
  });
}

if (addProductiveKeywordBtn) {
  addProductiveKeywordBtn.addEventListener("click", () => {
    addClassificationRule(appKeywordInput ? appKeywordInput.value : "", "productive");
    if (appKeywordInput) appKeywordInput.value = "";
    renderAppRules();
  });
}

if (addUnproductiveKeywordBtn) {
  addUnproductiveKeywordBtn.addEventListener("click", () => {
    addClassificationRule(appKeywordInput ? appKeywordInput.value : "", "unproductive");
    if (appKeywordInput) appKeywordInput.value = "";
    renderAppRules();
  });
}

if (toggleTrackingBtn) {
  toggleTrackingBtn.addEventListener("click", async () => {
    try {
      if (!isTracking) {
        await startSession();
        if (window.api && window.api.startTracking) window.api.startTracking();
      } else {
        const ok = confirm('Are you sure you want to stop the session?');
        if (!ok) return;
        await stopSession();
        if (window.api && window.api.stopTracking) window.api.stopTracking();
      }
    } catch (err) {
      console.error("Failed to toggle tracking:", err);
    }
  });
}

if (window.api && window.api.onUpdate) {
  window.api.onUpdate(data => {
    const now = new Date();
    currentWindowName = data.current || "No active window";
    updateUnproductiveSessionState(currentWindowName);
    const normalized = normalizeWindowActivity(currentWindowName);
    if (!normalized.isTracker) {
      lastActiveAppName = normalized.appName;
      lastActiveWindowTitle = normalized.tabName;
      seenAppNames.add(normalized.appName);
      renderOverrideTargetOptions();
      updateOverrideStatus();
    }

    saveLogToDatabase(normalized.isTracker ? normalized.appName : currentWindowName).catch(err => {
      console.error("Failed to save log:", err);
    });

    if (lastEntry && lastTimestamp && lastEntry !== currentWindowName) {
      const timeDiff = (now - lastTimestamp) / 1000 / 60;
      
      // Don't count tracker window time in statistics
      const lastNormalized = normalizeWindowActivity(lastEntry);
      if (!lastNormalized.isTracker) {
        const category = categorizeApp(lastEntry);
        timeSpent[category] += timeDiff;

        const dayKey = now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric"
        });
        const weekKey = `Week ${Math.ceil(now.getDate() / 7)}`;

        if (!weeklyData[dayKey]) {
          weeklyData[dayKey] = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
        }
        if (!monthlyData[weekKey]) {
          monthlyData[weekKey] = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
        }

        weeklyData[dayKey][category] += timeDiff;
        monthlyData[weekKey][category] += timeDiff;
      }
    }

    updateChart();
    updateLegend();
    addToLog(normalized.isTracker ? normalized.appName : currentWindowName, now);
    updateWeeklyCharts();
    updateMonthlyCharts();

    lastEntry = currentWindowName;
    lastTimestamp = now;
  });
}

if (window.api && window.api.onTrackingStatus) {
  window.api.onTrackingStatus(status => {
    const nextTrackingStatus = Boolean(status && status.isTracking);
    const wasTracking = lastTrackingStatus;
    isTracking = nextTrackingStatus;
    if (toggleTrackingBtn) {
      toggleTrackingBtn.textContent = isTracking ? "Stop Session" : "Start Session";
      toggleTrackingBtn.classList.toggle("active", isTracking);
    }

    if (takeBreakBtn) {
      takeBreakBtn.classList.toggle("disabled", !isTracking);
    }

    if (wasTracking === true && !isTracking) {
      clearDashboardActivity();
      stopUnproductiveMonitor();
      hideInactivityNotification();
    }

    // Start unproductive monitor when session begins
    if (wasTracking === false && isTracking) {
      resetAlertHistoryForSession();
      startUnproductiveMonitor();
      updateUnproductiveSessionState(currentWindowName);
    }

    lastTrackingStatus = isTracking;
  });
}

window.addEventListener("resize", () => {
  updateChartSize();
  if (activityChart) activityChart.resize();
});

addLogHeader();
updateDateDisplay();
setInterval(updateDateDisplay, 1000);
updateFontSize();
refreshDerivedAppLists();
renderAppRules();
renderOverrideTargetOptions();
updateOverrideStatus();
loadSessions();

// ============================================
// NOTIFICATION SYSTEM
// ============================================

// Notification Settings Storage
const NOTIFICATION_SETTINGS_KEY = "notificationSettingsV1";

let notificationSettings = {
  enabled: true,
  inactivityTimeout: 1, // in minutes
  soundMode: "normal" // soft, normal, hard
};

let unproductiveStartTime = null;
let unproductiveAlertTriggered = false;
let unproductiveMonitorInterval = null;
let notificationShown = false;
let alertHistory = [];

function resetAlertHistoryForSession() {
  alertHistory = [];
  renderAlertHistorySummary();
}

function formatAlertTime(isoTime) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderAlertHistorySummary() {
  const totalEl = document.getElementById("totalAlertCount");
  const unproductiveEl = document.getElementById("unproductiveAlertCount");
  const listEl = document.getElementById("unproductiveAlertHistory");
  if (!totalEl || !unproductiveEl || !listEl) return;

  const unproductiveAlerts = alertHistory.filter(item => item.category === "unproductive");
  totalEl.textContent = String(alertHistory.length);
  unproductiveEl.textContent = String(unproductiveAlerts.length);

  if (!unproductiveAlerts.length) {
    listEl.textContent = "No alerts yet.";
    return;
  }

  const recent = unproductiveAlerts.slice(0, 8);
  listEl.innerHTML = recent.map(item => {
    const app = (item.window || "Unknown").replace(/[<>]/g, "");
    return `<div class="notification-history-entry">${formatAlertTime(item.timestamp)} - ${app}</div>`;
  }).join("");
}

function recordAlertEvent(category, windowName, source) {
  alertHistory.unshift({
    timestamp: new Date().toISOString(),
    category: category || "unknown",
    window: windowName || "Unknown",
    source: source || "idle"
  });

  if (alertHistory.length > 200) {
    alertHistory = alertHistory.slice(0, 200);
  }

  renderAlertHistorySummary();
}

function updateUnproductiveSessionState(windowName) {
  if (!isTracking) {
    unproductiveStartTime = null;
    unproductiveAlertTriggered = false;
    return;
  }

  const activeWindow = String(windowName || "");
  if (!activeWindow || isTrackerWindow(activeWindow)) {
    unproductiveStartTime = null;
    unproductiveAlertTriggered = false;
    return;
  }

  const category = categorizeApp(activeWindow);
  if (category !== "unproductive") {
    unproductiveStartTime = null;
    unproductiveAlertTriggered = false;
    return;
  }

  if (!unproductiveStartTime) {
    unproductiveStartTime = Date.now();
    unproductiveAlertTriggered = false;
  }
}

function checkUnproductiveDuration() {
  if (!isTracking || !notificationSettings.enabled) return;
  if (!unproductiveStartTime || unproductiveAlertTriggered) return;

  const thresholdMs = notificationSettings.inactivityTimeout * 60 * 1000;
  const elapsedMs = Date.now() - unproductiveStartTime;

  if (elapsedMs >= thresholdMs) {
    const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60000));
    showInactivityNotification("unproductive-duration", elapsedMinutes);
    unproductiveAlertTriggered = true;
  }
}

function startUnproductiveMonitor() {
  if (unproductiveMonitorInterval) return;
  unproductiveMonitorInterval = setInterval(checkUnproductiveDuration, 1000);
}

function stopUnproductiveMonitor() {
  if (unproductiveMonitorInterval) {
    clearInterval(unproductiveMonitorInterval);
    unproductiveMonitorInterval = null;
  }

  unproductiveStartTime = null;
  unproductiveAlertTriggered = false;
}

/**
 * Load notification settings from localStorage
 */
function loadNotificationSettings() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      notificationSettings = { ...notificationSettings, ...parsed };
    }
  } catch (err) {
    console.warn("Failed to load notification settings:", err);
  }
  updateNotificationSettingsUI();
}

/**
 * Save notification settings to localStorage
 */
function saveNotificationSettings() {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notificationSettings));
  } catch (err) {
    console.warn("Failed to save notification settings:", err);
  }
}

/**
 * Update UI elements with current notification settings
 */
function updateNotificationSettingsUI() {
  const timeoutInput = document.getElementById("inactivityTimeout");
  const soundModeSelect = document.getElementById("notificationSoundMode");
  const enableCheckbox = document.getElementById("enableNotifications");

  if (timeoutInput) timeoutInput.value = notificationSettings.inactivityTimeout;
  if (soundModeSelect) soundModeSelect.value = notificationSettings.soundMode;
  if (enableCheckbox) enableCheckbox.checked = notificationSettings.enabled;

  renderAlertHistorySummary();
}

/**
 * Generate notification sound using Web Audio API with improved alarm patterns
 * @param {string} mode - "soft", "normal", or "hard"
 */
function playNotificationSound(mode = "normal") {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (mode === "soft") {
      // Soft: Single gentle chirp (ascending then descending)
      playChirp(audioContext, 400, 600, 0.4, 0.2);
    } else if (mode === "normal") {
      // Normal: Classic alarm pattern (beep-beep-pause repeated)
      playAlarmPattern(audioContext, [
        { freq: 800, duration: 0.15 },
        { freq: 0, duration: 0.1 },
        { freq: 800, duration: 0.15 },
        { freq: 0, duration: 0.2 },
        { freq: 900, duration: 0.15 },
        { freq: 0, duration: 0.1 },
        { freq: 900, duration: 0.15 }
      ], 0.6);
    } else if (mode === "hard") {
      // Hard: Loud multi-frequency alarm
      playAlarmPattern(audioContext, [
        { freq: 1000, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1000, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1200, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1200, duration: 0.1 },
        { freq: 0, duration: 0.1 },
        { freq: 1000, duration: 0.15 },
        { freq: 0, duration: 0.05 },
        { freq: 1200, duration: 0.15 }
      ], 0.85);
    }
  } catch (err) {
    console.warn("Failed to play notification sound:", err);
  }
}

/**
 * Play a chirp sound (ascending then descending frequency)
 */
function playChirp(audioContext, startFreq, endFreq, duration, volume) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Frequency sweep from start to end
  oscillator.frequency.setValueAtTime(startFreq, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(volume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

/**
 * Play an alarm pattern with multiple beeps
 */
function playAlarmPattern(audioContext, pattern, volume) {
  let currentTime = audioContext.currentTime;

  pattern.forEach((tone) => {
    if (tone.freq === 0) {
      // Silence
      currentTime += tone.duration;
    } else {
      // Beep with frequency sweep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(tone.freq, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(tone.freq * 0.9, currentTime + tone.duration);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + tone.duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + tone.duration);

      currentTime += tone.duration;
    }
  });
}

/**
 * Show inactivity notification popup
 */
function showInactivityNotification(source = "idle") {
  const notification = document.getElementById("inactivityNotification");
  const messageEl = document.querySelector(".notification-message");
  if (!notification) {
    console.warn("Notification element not found in DOM");
    return;
  }

  const activeWindow = currentWindowName || "Unknown";
  const category = categorizeApp(activeWindow);
  recordAlertEvent(category, activeWindow, source);

  if (messageEl) {
    const unproductiveCount = alertHistory.filter(item => item.category === "unproductive").length;
    messageEl.textContent = `You're staying too long in an unproductive app. Unproductive alerts so far: ${unproductiveCount}. Click to return to tracking.`;
  }

  notificationShown = true;
  notification.classList.add("show");
  console.log("Inactivity notification shown with sound mode:", notificationSettings.soundMode);

  if (window.api && window.api.showNativeNotification) {
    window.api.showNativeNotification({
      title: "Prodini - Unproductive App Alert",
      body: `You've been on an unproductive app for ${notificationSettings.inactivityTimeout} minute(s). App: ${activeWindow}`
    });
  }

  // Play sound
  if (notificationSettings.enabled) {
    playNotificationSound(notificationSettings.soundMode);
  }

  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideInactivityNotification();
  }, 10000);
}

/**
 * Hide inactivity notification popup
 */
function hideInactivityNotification() {
  const notification = document.getElementById("inactivityNotification");
  if (notification) {
    notification.classList.remove("show");
    notificationShown = false;
  }
}

/**
 * Check unproductive duration monitor state
 */
function resetInactivityTimer() {
  updateUnproductiveSessionState(currentWindowName);
}

/**
 * Setup notification UI event listeners
 */
function setupNotificationUI() {
  const enableCheckbox = document.getElementById("enableNotifications");
  const timeoutInput = document.getElementById("inactivityTimeout");
  const soundModeSelect = document.getElementById("notificationSoundMode");
  const notificationCloseBtn = document.querySelector(".notification-close");
  const notificationActionBtn = document.querySelector(".notification-action-btn");

  // Settings change handlers
  if (enableCheckbox) {
    enableCheckbox.addEventListener("change", () => {
      notificationSettings.enabled = enableCheckbox.checked;
      saveNotificationSettings();
      if (isTracking && notificationSettings.enabled) {
        startUnproductiveMonitor();
        updateUnproductiveSessionState(currentWindowName);
      } else if (!notificationSettings.enabled) {
        stopUnproductiveMonitor();
        hideInactivityNotification();
      }
    });
  }

  if (timeoutInput) {
    timeoutInput.addEventListener("change", () => {
      const value = parseInt(timeoutInput.value);
      if (value >= 1 && value <= 60) {
        notificationSettings.inactivityTimeout = value;
        saveNotificationSettings();
        if (isTracking) {
          updateUnproductiveSessionState(currentWindowName);
        }
      }
    });
  }

  if (soundModeSelect) {
    soundModeSelect.addEventListener("change", () => {
      notificationSettings.soundMode = soundModeSelect.value;
      saveNotificationSettings();
    });
  }

  // Notification popup close button
  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener("click", () => {
      console.log("✕ Notification closed by user");
      hideInactivityNotification();
    });
  }

  // Notification popup action button - redirect to app
  if (notificationActionBtn) {
    notificationActionBtn.addEventListener("click", () => {
      console.log("↩️ Returning to tracking from notification");
      hideInactivityNotification();
      // Focus on the main window/app
      if (window.api && window.api.focusApp) {
        window.api.focusApp();
      }
      // Switch to home view
      const homeBtn = document.querySelector('[data-view="home"]');
      if (homeBtn) {
        homeBtn.click();
      }
    });
  }

  if (window.api && window.api.onNativeNotificationClick) {
    window.api.onNativeNotificationClick(() => {
      hideInactivityNotification();
      const homeBtn = document.querySelector('[data-view="home"]');
      if (homeBtn) homeBtn.click();
    });
  }
}

// Load settings on startup
loadNotificationSettings();
setupNotificationUI();

console.log("🎯 Dashboard Loaded ✨");
console.log("📢 Notification system initialized - Settings:", notificationSettings);