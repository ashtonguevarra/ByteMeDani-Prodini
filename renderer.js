// DOM Elements
const logEl = document.getElementById("log");
const homeView = document.getElementById("homeView");
const weeklyView = document.getElementById("weeklyView");
const monthlyView = document.getElementById("monthlyView");
const navBtns = document.querySelectorAll(".nav-btn");
const dateDisplay = document.getElementById("dateDisplay");
const takeBreakBtn = document.getElementById("takeBreakBtn");
const breakModal = document.getElementById("breakModal");
const confirmBreakBtn = document.getElementById("confirmBreakBtn");
const cancelBreakBtn = document.getElementById("cancelBreakBtn");
const activeBreakBar = document.getElementById("activeBreakBar");
const breakTimerDisplay = document.getElementById("breakTimerDisplay");
const endBreakBtn = document.getElementById("endBreakBtn");
const breakHoursInput = document.getElementById("breakHoursInput");
const breakMinutesInput = document.getElementById("breakMinutesInput");
const overrideCurrentAppEl = document.getElementById("overrideCurrentApp");
const overrideStatusEl = document.getElementById("overrideStatus");
const overrideTargetAppSelect = document.getElementById("overrideTargetApp");
const useLastActiveAppBtn = document.getElementById("useLastActiveAppBtn");
const markProductiveBtn = document.getElementById("markProductiveBtn");
const markUnproductiveBtn = document.getElementById("markUnproductiveBtn");
const markRestBtn = document.getElementById("markRestBtn");
const markUnknownBtn = document.getElementById("markUnknownBtn");
const clearCurrentOverrideBtn = document.getElementById("clearCurrentOverrideBtn");
const appKeywordInput = document.getElementById("appKeywordInput");
const addProductiveKeywordBtn = document.getElementById("addProductiveKeywordBtn");
const addUnproductiveKeywordBtn = document.getElementById("addUnproductiveKeywordBtn");
const appRulesSortSelect = document.getElementById("appRulesSort");
const appRulesNotice = document.getElementById("appRulesNotice");
const appRulesList = document.getElementById("appRulesList");
const appRulesEmpty = document.getElementById("appRulesEmpty");
const notifyToggle = document.getElementById("notifyToggle");
const notifyThresholdInput = document.getElementById("notifyThresholdInput");
const notifyUnitSelect = document.getElementById("notifyUnitSelect");
const notifySummary = document.getElementById("notifySummary");
const reportHistoryList = document.getElementById("reportHistoryList");
const reportHistoryEmpty = document.getElementById("reportHistoryEmpty");
const clearReportHistoryBtn = document.getElementById("clearReportHistoryBtn");
const distractedModal = document.getElementById("distractedModal");
const distractSubmitBtn = document.getElementById("distractSubmitBtn");
const distractDismissBtn = document.getElementById("distractDismissBtn");
const distractNote = document.getElementById("distractNote");

let activityChart = null;
let weeklyChart = null;
let monthlyChart = null;
let weeklyChartFull = null;
let monthlyChartFull = null;
let sessionOverrides = {};
let recentOverrideTargets = [];
let lastNonTrackerWindowName = "";

// Break timer variables
let breakActive = false;
let breakInterval = null;
let breakEndTime = null;

// Font size control
let currentFontSize = 100;
const fontSizeDisplay = document.getElementById("fontSizeModal");

// Color customization
let customColors = {
  productive: "#4caf50",
  unproductive: "#f44336",
  rest: "#ff9800",
  unknown: "#9e9e9e",
  background: "#ffffff",
  text: "#000000"
};

// Update date display
function updateDateDisplay() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  dateDisplay.textContent = `${dateStr} • ${timeStr}`;
}
updateDateDisplay();
setInterval(updateDateDisplay, 1000);

// Sidebar toggle
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  sidebarToggle.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";
});

// Break modal functions
takeBreakBtn.addEventListener("click", () => {
  breakModal.style.display = "block";
});

cancelBreakBtn.addEventListener("click", () => {
  breakModal.style.display = "none";
});

confirmBreakBtn.addEventListener("click", () => {
  const hours = parseInt(breakHoursInput.value) || 0;
  const minutes = parseInt(breakMinutesInput.value) || 0;
  const totalMinutes = (hours * 60) + minutes;
  
  if (totalMinutes < 1) {
    alert("Please enter at least 1 minute for your break");
    return;
  }
  
  breakActive = true;
  breakEndTime = Date.now() + (totalMinutes * 60 * 1000);
  
  breakModal.style.display = "none";
  activeBreakBar.style.display = "flex";
  
  if (breakInterval) clearInterval(breakInterval);
  breakInterval = setInterval(updateBreakTimer, 1000);
  updateBreakTimer();
});

endBreakBtn.addEventListener("click", () => {
  stopBreak();
});

function stopBreak() {
  breakActive = false;
  if (breakInterval) {
    clearInterval(breakInterval);
    breakInterval = null;
  }
  activeBreakBar.style.display = "none";
}

function updateBreakTimer() {
  if (!breakActive || !breakEndTime) return;
  
  const now = Date.now();
  const timeLeft = breakEndTime - now;
  
  if (timeLeft <= 0) {
    stopBreak();
    return;
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  breakTimerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Add log header
function addLogHeader() {
  if (logEl && !document.querySelector('.log-header')) {
    const header = document.createElement('div');
    header.className = 'log-header';
    header.innerHTML = `
      <div class="log-header-app">Tab / Window Title</div>
      <div class="log-header-tab">App</div>
      <div class="log-header-time">Time</div>
    `;
    logEl.appendChild(header);
  }
}

// Navigation
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    homeView.classList.remove("active");
    weeklyView.classList.remove("active");
    monthlyView.classList.remove("active");
    
    if (view === "home") homeView.classList.add("active");
    if (view === "weekly") weeklyView.classList.add("active");
    if (view === "monthly") monthlyView.classList.add("active");
    
    if (view === "weekly") updateWeeklyFullView();
    if (view === "monthly") updateMonthlyFullView();
  });
});

// Font controls
document.getElementById("fontPlusModal").addEventListener("click", () => {
  if (currentFontSize < 130) {
    currentFontSize += 10;
    updateFontSize();
  }
});

document.getElementById("fontMinusModal").addEventListener("click", () => {
  if (currentFontSize > 70) {
    currentFontSize -= 10;
    updateFontSize();
  }
});

function updateFontSize() {
  fontSizeDisplay.textContent = currentFontSize + "%";
  document.documentElement.style.fontSize = (14 * currentFontSize / 100) + "px";
}

// Color palette modal
const modal = document.getElementById("colorModal");
const colorBtn = document.getElementById("colorPaletteBtn");
const closeBtn = document.querySelector(".close");
const applyColorsBtn = document.getElementById("applyColors");

colorBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

applyColorsBtn.onclick = () => {
  customColors.productive = document.getElementById("productiveColor").value;
  customColors.unproductive = document.getElementById("unproductiveColor").value;
  customColors.rest = document.getElementById("restColor").value;
  customColors.background = document.getElementById("bgColor").value;
  customColors.text = document.getElementById("textColor").value;
  
  document.querySelector(".main-content").style.background = customColors.background;
  document.querySelector(".main-content").style.color = customColors.text;
  
  updateChart();
  updateWeeklyCharts();
  updateMonthlyCharts();
  modal.style.display = "none";
};

// Category mapping
const DEFAULT_PRODUCTIVE_APPS = [
  'vscode', 'visual studio', 'cursor', 'intellij', 'pycharm', 
  'terminal', 'notion', 'figma', 'excel', 'word', 'code', 'brave', 'chrome', 'firefox',
  'github', 'gitlab', 'slack', 'teams', 'zoom', 'meet', 'gmail', 'outlook', 'drive',
  'docs', 'sheets', 'slides', 'postman', 'insomnia', 'jupyter', 'android studio',
  'xcode', 'datagrip', 'webstorm', 'sublime text', 'obsidian'
];

const DEFAULT_UNPRODUCTIVE_APPS = [
  'youtube', 'twitter', 'facebook', 'instagram', 'reddit', 
  'twitch', 'tiktok', 'netflix', 'hulu', 'snapchat', 'threads', 'pinterest', 'messenger'
];

let productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
let unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];

const restApps = [
  'calendar', 'reminders', 'clock', 'alarm', 'settings', 
  'spotify', 'music', 'apple music'
];

const APP_RULES_STORAGE_KEY = "tracker.appRules.v2";

let appRuleMeta = {};
let appRuleSortMode = "recent";
let recentlyAddedRuleKey = "";
let recentlyAddedRuleCategory = "";
let recentlyAddedRuleTimeout = null;

function normalizeKeyword(value) {
  return (value || "").toLowerCase().trim();
}

function dedupeKeywords(list) {
  return [...new Set((list || []).map(normalizeKeyword).filter(Boolean))];
}

function getKeywordCategory(keyword) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return null;
  if (productiveApps.includes(normalized)) return "productive";
  if (unproductiveApps.includes(normalized)) return "unproductive";
  return null;
}

function getRuleMeta(keyword) {
  return appRuleMeta[normalizeKeyword(keyword)] || { addedAt: 0 };
}

function setRuleMeta(keyword, updates) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return;

  appRuleMeta[normalized] = {
    ...(appRuleMeta[normalized] || {}),
    ...updates
  };
}

function loadAppRulesFromStorage() {
  try {
    const raw = localStorage.getItem(APP_RULES_STORAGE_KEY);
    if (!raw) {
      productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
      unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];
      appRuleMeta = {};
      appRuleSortMode = "recent";
      return;
    }

    const parsed = JSON.parse(raw);
    const savedProductive = dedupeKeywords(parsed.productive);
    const savedUnproductive = dedupeKeywords(parsed.unproductive);
    const savedMeta = parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {};

    productiveApps = savedProductive.length ? savedProductive : [...DEFAULT_PRODUCTIVE_APPS];
    unproductiveApps = savedUnproductive.length ? savedUnproductive : [...DEFAULT_UNPRODUCTIVE_APPS];
    unproductiveApps = unproductiveApps.filter(app => !productiveApps.includes(app));

    appRuleMeta = {};
    for (let index = 0; index < productiveApps.length; index += 1) {
      const keyword = productiveApps[index];
      const savedEntry = savedMeta[keyword];
      setRuleMeta(keyword, {
        addedAt: typeof savedEntry?.addedAt === "number" ? savedEntry.addedAt : (DEFAULT_PRODUCTIVE_APPS.includes(keyword) ? 0 : index + 1),
        category: "productive"
      });
    }

    for (let index = 0; index < unproductiveApps.length; index += 1) {
      const keyword = unproductiveApps[index];
      const savedEntry = savedMeta[keyword];
      setRuleMeta(keyword, {
        addedAt: typeof savedEntry?.addedAt === "number" ? savedEntry.addedAt : (DEFAULT_UNPRODUCTIVE_APPS.includes(keyword) ? 0 : index + 1),
        category: "unproductive"
      });
    }

    appRuleSortMode = ["recent", "alphabetical", "category"].includes(parsed.sortMode) ? parsed.sortMode : "recent";
  } catch {
    productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
    unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];
    appRuleMeta = {};
    appRuleSortMode = "recent";
  }
}

function saveAppRulesToStorage() {
  const payload = {
    productive: dedupeKeywords(productiveApps),
    unproductive: dedupeKeywords(unproductiveApps),
    meta: appRuleMeta,
    sortMode: appRulesSortSelect?.value || appRuleSortMode
  };
  localStorage.setItem(APP_RULES_STORAGE_KEY, JSON.stringify(payload));
}

// Notification settings and distraction reports
const NOTIFY_SETTINGS_KEY = 'tracker.notifySettings.v1';
const DISTRACTION_REPORTS_KEY = 'tracker.distractionReports.v1';
let notificationSettings = { enabled: true, thresholdMinutes: 5, unit: 'minutes' };
let distractionReports = [];
let unproductiveSessionStart = null;
let unproductiveNotified = false;
let lastUnproductiveApp = null;

function loadNotificationSettings() {
  try {
    const raw = localStorage.getItem(NOTIFY_SETTINGS_KEY);
    console.log('[Settings] Loaded from storage:', raw);
    if (!raw) {
      console.log('[Settings] No saved settings, using defaults');
      return;
    }
    const parsed = JSON.parse(raw);
    notificationSettings = {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      thresholdMinutes: typeof parsed.thresholdMinutes === 'number' ? parsed.thresholdMinutes : 5,
      unit: parsed.unit || 'minutes'
    };
    console.log('[Settings] Loaded settings:', notificationSettings);
  } catch (e) {
    console.error('[Settings] Error loading:', e);
  }
}

function saveNotificationSettings() {
  try {
    localStorage.setItem(NOTIFY_SETTINGS_KEY, JSON.stringify(notificationSettings));
  } catch (e) {}
}

function loadDistractionReports() {
  try {
    const raw = localStorage.getItem(DISTRACTION_REPORTS_KEY);
    if (!raw) { distractionReports = []; return; }
    distractionReports = JSON.parse(raw) || [];
  } catch (e) { distractionReports = []; }
}

function saveDistractionReport(report) {
  try {
    distractionReports.push(report);
    localStorage.setItem(DISTRACTION_REPORTS_KEY, JSON.stringify(distractionReports));
    renderDistractionReports();
  } catch (e) {}
}

function formatReportTime(ts) {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getReasonLabel(reason) {
  const labels = {
    notifications: 'Notifications',
    phone: 'Phone / Messages',
    social: 'Social Media',
    fatigue: 'Fatigue',
    other: 'Other',
    unknown: 'Unspecified'
  };
  return labels[reason] || labels.unknown;
}

function updateNotificationSummary() {
  if (!notifySummary) return;
  const enabled = notificationSettings.enabled ? 'On' : 'Off';
  const unit = notificationSettings.unit || 'minutes';
  const threshold = notificationSettings.thresholdMinutes || 5;
  notifySummary.textContent = `Alerts ${enabled} • Notify after ${threshold} ${unit} of continuous unproductive time.`;
}

function renderDistractionReports() {
  if (!reportHistoryList || !reportHistoryEmpty) return;

  const reports = [...distractionReports].sort((left, right) => right.ts - left.ts);
  reportHistoryList.innerHTML = '';
  reportHistoryEmpty.style.display = reports.length ? 'none' : 'block';

  for (const report of reports.slice(0, 10)) {
    const item = document.createElement('div');
    item.className = 'report-history-item';
    item.innerHTML = `
      <div class="report-history-top">
        <span class="report-history-app">${report.app || 'Unknown app'}</span>
        <span class="report-history-time">${formatReportTime(report.ts)}</span>
      </div>
      <div class="report-history-meta">${getReasonLabel(report.reason)} • ${report.durationMinutes || 0} min</div>
      ${report.note ? `<div class="report-history-note">${report.note}</div>` : ''}
    `;
    reportHistoryList.appendChild(item);
  }
}

// Initialize notification UI values
loadNotificationSettings();
loadDistractionReports();
if (notifyToggle) notifyToggle.checked = !!notificationSettings.enabled;
if (notifyThresholdInput) notifyThresholdInput.value = notificationSettings.thresholdMinutes || 5;
if (notifyUnitSelect) notifyUnitSelect.value = notificationSettings.unit || 'minutes';
updateNotificationSummary();
renderDistractionReports();

// Hook up UI changes
if (notifyToggle) notifyToggle.addEventListener('change', () => {
  notificationSettings.enabled = !!notifyToggle.checked;
  saveNotificationSettings();
  updateNotificationSummary();
});
if (notifyThresholdInput) notifyThresholdInput.addEventListener('change', () => {
  const val = parseInt(notifyThresholdInput.value) || 0;
  notificationSettings.thresholdMinutes = val;
  saveNotificationSettings();
  updateNotificationSummary();
});
if (notifyUnitSelect) notifyUnitSelect.addEventListener('change', () => {
  notificationSettings.unit = notifyUnitSelect.value || 'minutes';
  saveNotificationSettings();
  updateNotificationSummary();
});

if (clearReportHistoryBtn) {
  clearReportHistoryBtn.addEventListener('click', () => {
    distractionReports = [];
    localStorage.setItem(DISTRACTION_REPORTS_KEY, JSON.stringify(distractionReports));
    renderDistractionReports();
  });
}

// Distracted modal handlers
if (distractDismissBtn) {
  distractDismissBtn.addEventListener('click', () => {
    if (distractedModal) distractedModal.style.display = 'none';
  });
}
if (distractSubmitBtn) {
  distractSubmitBtn.addEventListener('click', () => {
    const reasonEl = document.querySelector('input[name="distractReason"]:checked');
    const reason = reasonEl ? reasonEl.value : 'unknown';
    const note = (distractNote?.value || '').trim();
    const duration = unproductiveSessionStart ? Math.round((Date.now() - unproductiveSessionStart) / 60000) : 0;
    const report = { ts: Date.now(), app: lastUnproductiveApp || '', durationMinutes: duration, reason, note };
    saveDistractionReport(report);
    if (distractedModal) distractedModal.style.display = 'none';
  });
}

function triggerUnproductiveNotification(app, durationMinutes) {
  try {
    const title = 'Unproductive time detected';
    const body = `You've been on unproductive activities for ${durationMinutes} minute(s) — ${app}`;
    console.log('[Notification] Attempting to trigger:', { title, body, app, durationMinutes });
    if (window.api?.showUnproductiveNotification) {
      window.api.showUnproductiveNotification({ title, body }).catch(err => {
        console.error('[Notification] IPC notification error:', err);
      });
    } else if (window.Notification) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body }); });
      }
    }
  } catch (e) {
    console.error('[Notification] Exception:', e);
  }

  // Show in-app prompt
  lastUnproductiveApp = app;
  if (distractedModal) {
    console.log('[Distraction Modal] Showing distraction modal');
    // clear previous selections
    const checked = document.querySelector('input[name="distractReason"]:checked');
    if (checked) checked.checked = false;
    if (distractNote) distractNote.value = '';
    distractedModal.style.display = 'block';
  } else {
    console.log('[Distraction Modal] Modal element not found!');
  }
}

function setAppRulesNotice(message) {
  if (!appRulesNotice) return;
  appRulesNotice.textContent = message || "";
  if (message) {
    window.clearTimeout(recentlyAddedRuleTimeout);
    recentlyAddedRuleTimeout = window.setTimeout(() => {
      if (appRulesNotice) appRulesNotice.textContent = "";
      recentlyAddedRuleKey = "";
      if (appRulesList) renderAppRulesEditor();
    }, 2200);
  }
}

function removeKeywordFromRules(keyword) {
  const normalized = normalizeKeyword(keyword);
  productiveApps = productiveApps.filter(app => app !== normalized);
  unproductiveApps = unproductiveApps.filter(app => app !== normalized);
  delete appRuleMeta[normalized];
}

function setKeywordCategory(keyword, category, isChecked) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return;

  if (category === "productive") {
    if (isChecked) {
      if (!productiveApps.includes(normalized)) productiveApps.push(normalized);
      unproductiveApps = unproductiveApps.filter(app => app !== normalized);
      setRuleMeta(normalized, { addedAt: getRuleMeta(normalized).addedAt || Date.now(), category: "productive" });
    } else {
      productiveApps = productiveApps.filter(app => app !== normalized);
      if (getKeywordCategory(normalized) !== "unproductive") delete appRuleMeta[normalized];
    }
  }

  if (category === "unproductive") {
    if (isChecked) {
      if (!unproductiveApps.includes(normalized)) unproductiveApps.push(normalized);
      productiveApps = productiveApps.filter(app => app !== normalized);
      setRuleMeta(normalized, { addedAt: getRuleMeta(normalized).addedAt || Date.now(), category: "unproductive" });
    } else {
      unproductiveApps = unproductiveApps.filter(app => app !== normalized);
      if (getKeywordCategory(normalized) !== "productive") delete appRuleMeta[normalized];
    }
  }

  saveAppRulesToStorage();
  renderAppRulesEditor();
}

function addKeywordToCategory(category) {
  const normalized = normalizeKeyword(appKeywordInput?.value || "");
  if (!normalized) return;

  if (category === "productive") {
    if (!productiveApps.includes(normalized)) productiveApps.push(normalized);
    unproductiveApps = unproductiveApps.filter(app => app !== normalized);
    setRuleMeta(normalized, { addedAt: Date.now(), category: "productive" });
  }

  if (category === "unproductive") {
    if (!unproductiveApps.includes(normalized)) unproductiveApps.push(normalized);
    productiveApps = productiveApps.filter(app => app !== normalized);
    setRuleMeta(normalized, { addedAt: Date.now(), category: "unproductive" });
  }

  recentlyAddedRuleKey = normalized;
  recentlyAddedRuleCategory = category;
  saveAppRulesToStorage();
  renderAppRulesEditor();
  setAppRulesNotice(`Added ${normalized} to ${getCategoryLabel(category)}.`);
  if (appKeywordInput) appKeywordInput.value = "";
}

function getSortedAppRules() {
  const keywords = [...new Set([...productiveApps, ...unproductiveApps])];
  const sortMode = appRulesSortSelect?.value || appRuleSortMode || "recent";

  if (sortMode === "alphabetical") {
    return keywords.sort((left, right) => left.localeCompare(right));
  }

  if (sortMode === "category") {
    return keywords.sort((left, right) => {
      const leftCategory = getKeywordCategory(left) || "";
      const rightCategory = getKeywordCategory(right) || "";
      if (leftCategory !== rightCategory) {
        return leftCategory === "productive" ? -1 : 1;
      }
      return left.localeCompare(right);
    });
  }

  return keywords.sort((left, right) => {
    const leftTime = getRuleMeta(left).addedAt || 0;
    const rightTime = getRuleMeta(right).addedAt || 0;
    if (leftTime !== rightTime) return rightTime - leftTime;
    return left.localeCompare(right);
  });
}

function isAppBuiltIn(keyword) {
  return DEFAULT_PRODUCTIVE_APPS.includes(keyword) || DEFAULT_UNPRODUCTIVE_APPS.includes(keyword);
}

function renderAppRulesEditor() {
  if (!appRulesList || !appRulesEmpty) return;

  const keywords = getSortedAppRules();
  appRulesList.innerHTML = "";
  appRulesEmpty.style.display = keywords.length ? "none" : "block";

  // Split into built-in and custom
  const builtInApps = keywords.filter(k => isAppBuiltIn(k));
  const customApps = keywords.filter(k => !isAppBuiltIn(k));

  // Render Custom section first
  if (customApps.length > 0) {
    const customHeader = document.createElement("div");
    customHeader.className = "app-rules-section-header";
    customHeader.textContent = "Custom Apps";
    appRulesList.appendChild(customHeader);

    for (const keyword of customApps) {
      const row = document.createElement("div");
      row.className = "app-rule-row app-rule-custom";
      if (keyword === recentlyAddedRuleKey) row.classList.add("highlighted");
      row.innerHTML = `
        <span class="app-rule-name" title="${keyword}">${keyword}</span>
        <div class="app-rule-check">
          <input type="checkbox" data-keyword="${keyword}" data-category="productive" ${productiveApps.includes(keyword) ? "checked" : ""}>
        </div>
        <div class="app-rule-check">
          <input type="checkbox" data-keyword="${keyword}" data-category="unproductive" ${unproductiveApps.includes(keyword) ? "checked" : ""}>
        </div>
        <button class="app-rule-remove" data-remove="${keyword}">Remove</button>
      `;
      appRulesList.appendChild(row);
    }
  }

  // Render Built-in section
  if (builtInApps.length > 0) {
    const builtInHeader = document.createElement("div");
    builtInHeader.className = "app-rules-section-header";
    builtInHeader.textContent = "Built-in Apps (Locked)";
    appRulesList.appendChild(builtInHeader);

    for (const keyword of builtInApps) {
      const row = document.createElement("div");
      row.className = "app-rule-row app-rule-builtin";
      if (keyword === recentlyAddedRuleKey) row.classList.add("highlighted");
      row.innerHTML = `
        <span class="app-rule-name" title="${keyword}">${keyword}</span>
        <div class="app-rule-check">
          <input type="checkbox" data-keyword="${keyword}" data-category="productive" ${productiveApps.includes(keyword) ? "checked" : ""}>
        </div>
        <div class="app-rule-check">
          <input type="checkbox" data-keyword="${keyword}" data-category="unproductive" ${unproductiveApps.includes(keyword) ? "checked" : ""}>
        </div>
        <button class="app-rule-remove app-rule-remove-disabled" disabled title="Built-in apps cannot be removed">Locked</button>
      `;
      appRulesList.appendChild(row);
    }
  }
}

loadAppRulesFromStorage();
if (appRulesSortSelect) appRulesSortSelect.value = appRuleSortMode;

function getCategoryLabel(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function isTrackerWindow(windowTitle) {
  const lower = (windowTitle || "").toLowerCase();
  return lower.includes("electron") || lower.includes("tracker");
}

function registerOverrideTarget(windowTitle) {
  if (!windowTitle || isTrackerWindow(windowTitle)) return;

  const { appName } = extractAppAndTitle(windowTitle);
  const appKey = appName.toLowerCase().trim();
  if (!appKey) return;

  recentOverrideTargets = recentOverrideTargets.filter(target => target.key !== appKey);
  recentOverrideTargets.unshift({ key: appKey, label: appName });
  if (recentOverrideTargets.length > 30) {
    recentOverrideTargets = recentOverrideTargets.slice(0, 30);
  }
}

function refreshOverrideTargetOptions(preferredKey) {
  if (!overrideTargetAppSelect) return;

  const currentValue = preferredKey || overrideTargetAppSelect.value;
  overrideTargetAppSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select app to override";
  overrideTargetAppSelect.appendChild(placeholder);

  for (const target of recentOverrideTargets) {
    const option = document.createElement("option");
    option.value = target.key;
    option.textContent = target.label;
    overrideTargetAppSelect.appendChild(option);
  }

  if (currentValue && recentOverrideTargets.some(target => target.key === currentValue)) {
    overrideTargetAppSelect.value = currentValue;
  }
}

function getSelectedOverrideTargetKey() {
  if (!overrideTargetAppSelect) return null;
  const selected = (overrideTargetAppSelect.value || "").trim();
  return selected || null;
}

function getAppOverride(windowTitle) {
  const { appName } = extractAppAndTitle(windowTitle || "");
  const appKey = appName.toLowerCase().trim();
  if (!appKey) return null;
  return sessionOverrides[appKey] || null;
}

function categorizeApp(appName) {
  if (breakActive) return 'rest';

  const appOverride = getAppOverride(appName);
  if (appOverride) return appOverride;
  
  appName = appName.toLowerCase();

  const educationalKeywords = [
    'tutorial', 'lesson', 'lecture', 'course', 'class',
    'walkthrough', 'how to', 'documentation', 'docs', 'guide', 'webinar'
  ];

  const learningIntent = educationalKeywords.some(keyword => appName.includes(keyword));

  if (
    (appName.includes('youtube') || appName.includes('facebook') || appName.includes('reddit')) &&
    learningIntent
  ) {
    return 'productive';
  }

  for (const app of productiveApps) if (appName.includes(app)) return 'productive';
  for (const app of unproductiveApps) if (appName.includes(app)) return 'unproductive';
  for (const app of restApps) if (appName.includes(app)) return 'rest';
  return 'unknown';
}

function updateOverrideStatus() {
  if (!overrideCurrentAppEl || !overrideStatusEl) return;

  const targetKey = getSelectedOverrideTargetKey();
  const target = targetKey ? recentOverrideTargets.find(item => item.key === targetKey) : null;
  overrideCurrentAppEl.textContent = target?.label || "No target selected";

  const currentOverride = targetKey ? sessionOverrides[targetKey] : null;
  overrideStatusEl.textContent = currentOverride
    ? `Manual override active: ${getCategoryLabel(currentOverride)}`
    : "No manual override for selected app.";
}

function applyOverrideToSelectedApp(category) {
  const targetKey = getSelectedOverrideTargetKey();
  if (!targetKey) return;

  sessionOverrides[targetKey] = category;
  updateOverrideStatus();
}

function clearOverrideForSelectedApp() {
  const targetKey = getSelectedOverrideTargetKey();
  if (!targetKey) return;

  delete sessionOverrides[targetKey];
  updateOverrideStatus();
}

if (markProductiveBtn) markProductiveBtn.addEventListener("click", () => applyOverrideToSelectedApp("productive"));
if (markUnproductiveBtn) markUnproductiveBtn.addEventListener("click", () => applyOverrideToSelectedApp("unproductive"));
if (markRestBtn) markRestBtn.addEventListener("click", () => applyOverrideToSelectedApp("rest"));
if (markUnknownBtn) markUnknownBtn.addEventListener("click", () => applyOverrideToSelectedApp("unknown"));
if (clearCurrentOverrideBtn) clearCurrentOverrideBtn.addEventListener("click", clearOverrideForSelectedApp);
if (addProductiveKeywordBtn) addProductiveKeywordBtn.addEventListener("click", () => addKeywordToCategory("productive"));
if (addUnproductiveKeywordBtn) addUnproductiveKeywordBtn.addEventListener("click", () => addKeywordToCategory("unproductive"));
if (appKeywordInput) {
  appKeywordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addKeywordToCategory("productive");
    }
  });
}

if (appRulesList) {
  appRulesList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const keyword = target.dataset.keyword;
    const category = target.dataset.category;
    if (!keyword || !category) return;

    setKeywordCategory(keyword, category, target.checked);
  });

  appRulesList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const removeKeyword = target.dataset.remove;
    if (!removeKeyword) return;

    // Prevent removal of built-in apps
    if (isAppBuiltIn(removeKeyword)) {
      return;
    }

    removeKeywordFromRules(removeKeyword);
    saveAppRulesToStorage();
    renderAppRulesEditor();
  });
}

if (appRulesSortSelect) {
  appRulesSortSelect.addEventListener("change", () => {
    appRuleSortMode = appRulesSortSelect.value;
    saveAppRulesToStorage();
    renderAppRulesEditor();
  });
}

if (overrideTargetAppSelect) overrideTargetAppSelect.addEventListener("change", updateOverrideStatus);
if (useLastActiveAppBtn) {
  useLastActiveAppBtn.addEventListener("click", () => {
    if (!lastNonTrackerWindowName) return;

    const { appName } = extractAppAndTitle(lastNonTrackerWindowName);
    const appKey = appName.toLowerCase().trim();
    if (!appKey) return;

    registerOverrideTarget(lastNonTrackerWindowName);
    refreshOverrideTargetOptions(appKey);
    updateOverrideStatus();
  });
}

renderAppRulesEditor();

// Extract app name and tab title from window title - SWAPPED priority
function extractAppAndTitle(windowTitle) {
  let appName = "";
  let tabName = "";
  
  // Pattern 1: "App Name - Tab Title" 
  if (windowTitle.includes(" - ")) {
    const parts = windowTitle.split(" - ");
    if (parts.length >= 2) {
      appName = parts[0];
      tabName = parts.slice(1).join(" - ");
    }
  } 
  // Pattern 2: "Tab Title | App Name"
  else if (windowTitle.includes(" | ")) {
    const parts = windowTitle.split(" | ");
    if (parts.length >= 2) {
      appName = parts[parts.length - 1];
      tabName = parts.slice(0, -1).join(" | ");
    }
  } 
  // Pattern 3: No separator
  else {
    appName = windowTitle;
    tabName = "";
  }
  
  // Clean up app name (remove extensions, common suffixes)
  appName = appName.replace(/\.exe$/i, '').trim();
  
  // SWAPPED: If tabName is empty, copy from appName
  if (!tabName || tabName.trim() === "") {
    tabName = appName;
  }
  
  // If appName is empty, copy from tabName
  if (!appName || appName.trim() === "") {
    appName = tabName;
  }
  
  // Truncate for display
  if (tabName.length > 50) tabName = tabName.substring(0, 47) + '...';
  if (appName.length > 25) appName = appName.substring(0, 22) + '...';
  
  return { tabName, appName };
}

// Time tracking
let timeSpent = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
let weeklyData = {};
let monthlyData = {};
let lastEntry = null;
let lastTimestamp = null;
let currentWindowName = "";

addLogHeader();

window.api.onUpdate((data) => {
  const now = new Date();
  currentWindowName = data.current || "No active window";
  console.log('[onUpdate] Window changed to:', currentWindowName);

  if (!isTrackerWindow(currentWindowName)) {
    lastNonTrackerWindowName = currentWindowName;
    const { appName } = extractAppAndTitle(currentWindowName);
    const appKey = appName.toLowerCase().trim();
    registerOverrideTarget(currentWindowName);
    refreshOverrideTargetOptions(getSelectedOverrideTargetKey() || appKey);
  }

  updateOverrideStatus();

  // Unproductive session detection for alerts
  if (!isTrackerWindow(currentWindowName) && notificationSettings.enabled) {
    const currentCategoryForNotify = categorizeApp(currentWindowName);
    console.log('[onUpdate] Unproductive detection - Category:', currentCategoryForNotify);

    if (currentCategoryForNotify === 'unproductive') {
      if (!unproductiveSessionStart) {
        console.log('[onUpdate] Starting new unproductive session');
        unproductiveSessionStart = now.getTime();
        unproductiveNotified = false;
        lastUnproductiveApp = currentWindowName;
        console.log('[onUpdate] Session info:', { start: unproductiveSessionStart, app: lastUnproductiveApp });
      }

      if (!unproductiveNotified) {
        const threshold = notificationSettings.thresholdMinutes || 5;
        const thresholdMs = (notificationSettings.unit === 'hours'
          ? threshold * 60 * 60 * 1000
          : threshold * 60 * 1000);

        if (thresholdMs > 0 && (now.getTime() - unproductiveSessionStart) >= thresholdMs) {
          triggerUnproductiveNotification(lastUnproductiveApp || currentWindowName, Math.max(1, Math.round((now.getTime() - unproductiveSessionStart) / 60000)));
          unproductiveNotified = true;
        }
      }
    } else {
      unproductiveSessionStart = null;
      unproductiveNotified = false;
      lastUnproductiveApp = null;
    }
  } else if (isTrackerWindow(currentWindowName)) {
    unproductiveSessionStart = null;
    unproductiveNotified = false;
    lastUnproductiveApp = null;
  }
  
  if (lastEntry && lastTimestamp && lastEntry !== currentWindowName) {
    const timeDiff = (now - lastTimestamp) / 1000 / 60;
    const category = categorizeApp(lastEntry);
    timeSpent[category] += timeDiff;
    
    const dateKey = now.toDateString();
    if (!weeklyData[dateKey]) weeklyData[dateKey] = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
    weeklyData[dateKey][category] += timeDiff;
    
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { productive: 0, unproductive: 0, rest: 0, unknown: 0 };
    monthlyData[monthKey][category] += timeDiff;
  }
  
  updateChart();
  updateLegend();
  // Don't log the tracker app itself to activity log
  if (!isTrackerWindow(currentWindowName)) {
    addToLog(currentWindowName, now);
  }
  updateWeeklyCharts();
  updateMonthlyCharts();
  
  lastEntry = currentWindowName;
  lastTimestamp = now;
});

// === Periodic check for continuous unproductive sessions ===
// Catches long sessions on same app where window changes don't trigger onUpdate()
let timerCheckCount = 0;
setInterval(() => {
  try {
    timerCheckCount++;
    console.log(`[Timer Check #${timerCheckCount}]`, {
      enabled: notificationSettings.enabled,
      currentWindow: currentWindowName,
      isTracker: isTrackerWindow(currentWindowName),
      sessionStart: unproductiveSessionStart,
      alreadyNotified: unproductiveNotified
    });
    
    if (!notificationSettings.enabled || !currentWindowName || isTrackerWindow(currentWindowName)) return;
    
    const currentCategory = categorizeApp(currentWindowName);
    console.log(`[Timer Check #${timerCheckCount}] Category for "${currentWindowName}":`, currentCategory);
    
    if (currentCategory !== 'unproductive' || !unproductiveSessionStart || unproductiveNotified) return;
    
    const threshold = notificationSettings.thresholdMinutes || 5;
    const thresholdMs = (notificationSettings.unit === 'hours'
      ? threshold * 60 * 60 * 1000
      : threshold * 60 * 1000);
    const elapsed = Date.now() - unproductiveSessionStart;
    
    console.log(`[Timer Check #${timerCheckCount}] Threshold check:`, {
      threshold: threshold + ' ' + notificationSettings.unit,
      thresholdMs: thresholdMs,
      elapsedMs: elapsed,
      elapsedMinutes: Math.round(elapsed / 60000),
      shouldTrigger: thresholdMs > 0 && elapsed >= thresholdMs
    });
    
    if (thresholdMs > 0 && elapsed >= thresholdMs) {
      console.log(`[Timer Check #${timerCheckCount}] TRIGGERING NOTIFICATION!`);
      triggerUnproductiveNotification(lastUnproductiveApp || currentWindowName, Math.max(1, Math.round(elapsed / 60000)));
      unproductiveNotified = true;
    }
  } catch (e) {
    console.error(`[Timer Check] Error:`, e);
  }
}, 30000); // Check every 30 seconds

// Responsive pie chart size
function updateChartSize() {
  const chartContainer = document.querySelector('.chart-wrapper');
  const canvas = document.getElementById('activityChart');
  const windowWidth = window.innerWidth;
  
  if (chartContainer && canvas) {
    if (windowWidth < 900) {
      canvas.style.width = '200px';
      canvas.style.height = '200px';
    } else if (windowWidth < 1100) {
      canvas.style.width = '220px';
      canvas.style.height = '220px';
    } else {
      canvas.style.width = '250px';
      canvas.style.height = '250px';
    }
  }
}

window.addEventListener('resize', () => {
  updateChartSize();
  if (activityChart) activityChart.resize();
});

function updateChart() {
  const ctx = document.getElementById('activityChart').getContext('2d');
  updateChartSize();
  const chartLabels = ['Productive', 'Unproductive', 'Rest'];
  const chartData = [timeSpent.productive, timeSpent.unproductive, timeSpent.rest];
  
  if (activityChart) {
    activityChart.data.labels = chartLabels;
    activityChart.data.datasets[0].data = chartData;
    activityChart.data.datasets[0].backgroundColor = [customColors.productive, customColors.unproductive, customColors.rest];
    activityChart.update();
  } else {
    activityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: [customColors.productive, customColors.unproductive, customColors.rest],
          borderWidth: 1,
          radius: '90%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { 
            callbacks: { 
              label: (context) => {
                const value = context.raw || 0;
                const total = timeSpent.productive + timeSpent.unproductive + timeSpent.rest;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const hours = Math.floor(value / 60);
                const mins = Math.floor(value % 60);
                return `${hours > 0 ? hours + 'h ' : ''}${mins}m (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}

function updateLegend() {
  const legendContainer = document.getElementById("chartLegend");
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  if (legendContainer) {
    legendContainer.innerHTML = `
      <div class="legend-item">
        <div style="display:flex; align-items:center;">
          <div class="legend-color" style="background: ${customColors.productive}"></div>
          <span class="legend-label">Productive</span>
        </div>
        <span class="legend-time">${formatTime(timeSpent.productive)}</span>
      </div>
      <div class="legend-item">
        <div style="display:flex; align-items:center;">
          <div class="legend-color" style="background: ${customColors.unproductive}"></div>
          <span class="legend-label">Unproductive</span>
        </div>
        <span class="legend-time">${formatTime(timeSpent.unproductive)}</span>
      </div>
      <div class="legend-item">
        <div style="display:flex; align-items:center;">
          <div class="legend-color" style="background: ${customColors.rest}"></div>
          <span class="legend-label">Rest</span>
        </div>
        <span class="legend-time">${formatTime(timeSpent.rest)}</span>
      </div>
    `;
  }
}

function addToLog(windowName, timestamp) {
  if (!logEl) return;
  
  const { tabName, appName } = extractAppAndTitle(windowName);
  const div = document.createElement("div");
  div.className = "log-entry";
  
  if (windowName === currentWindowName) {
    div.classList.add("current");
  }
  
  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const category = categorizeApp(windowName);
  const categoryColor = customColors[category];
  
  // Keep original lettering/casing
  div.innerHTML = `
    <div class="log-app" title="${tabName}">
      <span class="category-circle" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${categoryColor}; margin-right: 8px;"></span>
      ${tabName}
    </div>
    <div class="log-tab" title="${appName}">${appName}</div>
    <span class="log-time">${timeStr}</span>
  `;
  
  // Insert after header (index 0 is header)
  if (logEl.children.length > 1) {
    logEl.insertBefore(div, logEl.children[1]);
  } else {
    logEl.appendChild(div);
  }
  
  // Keep only last 100 entries (excluding header)
  while (logEl.children.length > 101) {
    logEl.removeChild(logEl.lastChild);
  }
}

function updateWeeklyCharts() {
  const last7Days = getLast7Days();
  const weeklyDataPoints = last7Days.map(day => ({
    day: day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));
  
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  if (weeklyChart) weeklyChart.destroy();
  
  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyDataPoints.map(d => d.day),
      datasets: [
        { label: 'Productive', data: weeklyDataPoints.map(d => d.productive), backgroundColor: customColors.productive, borderRadius: 4 },
        { label: 'Unproductive', data: weeklyDataPoints.map(d => d.unproductive), backgroundColor: customColors.unproductive, borderRadius: 4 },
        { label: 'Rest', data: weeklyDataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true, 
      scales: { x: { stacked: true }, y: { stacked: true } }, 
      plugins: { 
        legend: { position: 'bottom', labels: { font: { size: 10 } } }
      }
    }
  });
}

function updateMonthlyCharts() {
  const last4Weeks = getLast4Weeks();
  const monthlyDataPoints = last4Weeks.map(week => ({
    week: week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
  }));
  
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (monthlyChart) monthlyChart.destroy();
  
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthlyDataPoints.map(d => d.week),
      datasets: [
        { label: 'Productive', data: monthlyDataPoints.map(d => d.productive), backgroundColor: customColors.productive, borderRadius: 4 },
        { label: 'Unproductive', data: monthlyDataPoints.map(d => d.unproductive), backgroundColor: customColors.unproductive, borderRadius: 4 },
        { label: 'Rest', data: monthlyDataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true, 
      scales: { x: { stacked: true }, y: { stacked: true } }, 
      plugins: { 
        legend: { position: 'bottom', labels: { font: { size: 10 } } }
      }
    }
  });
}

function updateWeeklyFullView() {
  const last7Days = getLast7Days();
  const weeklyDataPoints = last7Days.map(day => ({
    day: day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));
  
  const ctx = document.getElementById('weeklyChartFull').getContext('2d');
  if (weeklyChartFull) weeklyChartFull.destroy();
  
  weeklyChartFull = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyDataPoints.map(d => d.day),
      datasets: [
        { label: 'Productive', data: weeklyDataPoints.map(d => d.productive), backgroundColor: customColors.productive, borderRadius: 4 },
        { label: 'Unproductive', data: weeklyDataPoints.map(d => d.unproductive), backgroundColor: customColors.unproductive, borderRadius: 4 },
        { label: 'Rest', data: weeklyDataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true, 
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}

function updateMonthlyFullView() {
  const last4Weeks = getLast4Weeks();
  const monthlyDataPoints = last4Weeks.map(week => ({
    week: week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
  }));
  
  const ctx = document.getElementById('monthlyChartFull').getContext('2d');
  if (monthlyChartFull) monthlyChartFull.destroy();
  
  monthlyChartFull = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthlyDataPoints.map(d => d.week),
      datasets: [
        { label: 'Productive', data: monthlyDataPoints.map(d => d.productive), backgroundColor: customColors.productive, borderRadius: 4 },
        { label: 'Unproductive', data: monthlyDataPoints.map(d => d.unproductive), backgroundColor: customColors.unproductive, borderRadius: 4 },
        { label: 'Rest', data: monthlyDataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true, 
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }
  return days;
}

function getLast4Weeks() {
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    weeks.push(`Week ${4 - i}`);
  }
  return weeks;
}

// Summary button placeholder
const generateSummaryBtn = document.getElementById("generateSummaryBtn");
if (generateSummaryBtn) {
  generateSummaryBtn.addEventListener("click", () => {
    const summaryMessage = document.querySelector(".summary-message");
    if (summaryMessage) {
      summaryMessage.textContent = "Summary feature coming soon!";
      setTimeout(() => {
        summaryMessage.textContent = "Summary will appear here";
      }, 2000);
    }
  });
}

console.log('Dashboard Loaded ✨');