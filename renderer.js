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

let weeklyData = {};
let monthlyData = {};
let lastEntry = null;
let lastTimestamp = null;
let currentWindowName = "";

const DEFAULT_PRODUCTIVE_APPS = [
  "vscode", "visual studio", "cursor", "intellij", "pycharm",
  "terminal", "notion", "figma", "excel", "word", "code", "brave", "chrome", "firefox",
  "github", "gitlab", "slack", "teams", "zoom", "meet", "gmail", "outlook", "drive",
  "docs", "sheets", "slides", "postman", "insomnia", "jupyter", "android studio",
  "xcode", "datagrip", "webstorm", "sublime text", "obsidian"
];

const DEFAULT_UNPRODUCTIVE_APPS = [
  "youtube", "twitter", "facebook", "instagram", "reddit",
  "twitch", "tiktok", "netflix", "hulu", "snapchat", "threads", "pinterest", "messenger"
];

const restApps = ["calendar", "reminders", "clock", "alarm", "settings", "spotify", "music", "apple music"];

let productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
let unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];

function getEl(id) {
  return document.getElementById(id);
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
  if (breakActive) return "rest";

  const lowerName = appName.toLowerCase();
  const educationalKeywords = ["tutorial", "lesson", "lecture", "course", "class", "walkthrough", "how to", "documentation", "docs", "guide", "webinar"];
  const learningIntent = educationalKeywords.some(keyword => lowerName.includes(keyword));

  if ((lowerName.includes("youtube") || lowerName.includes("facebook") || lowerName.includes("reddit")) && learningIntent) {
    return "productive";
  }

  for (const app of productiveApps) if (lowerName.includes(app)) return "productive";
  for (const app of unproductiveApps) if (lowerName.includes(app)) return "unproductive";
  for (const app of restApps) if (lowerName.includes(app)) return "rest";

  return "unknown";
}

async function startSession() {
  const res = await fetch("http://127.0.0.1:5000/sessions/start", { method: "POST" });
  const data = await res.json();
  currentSessionId = data.session_id;
  localStorage.setItem("currentSessionId", currentSessionId);
  loadSessions();
}

async function stopSession() {
  if (!currentSessionId) return;

  await fetch(`http://127.0.0.1:5000/sessions/${currentSessionId}/stop`, { method: "POST" });
  currentSessionId = null;
  localStorage.removeItem("currentSessionId");
  loadSessions();
}

async function saveLogToDatabase(windowTitle) {
  if (!currentSessionId) return;

  const extracted = extractAppAndTitle(windowTitle);
  await fetch("http://127.0.0.1:5000/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: Number(currentSessionId),
      app_name: extracted.appName,
      window_title: windowTitle
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

  const { tabName, appName } = extractAppAndTitle(windowName);
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

  const labels = ["Productive", "Unproductive", "Rest", "Unknown"];
  const data = [timeSpent.productive, timeSpent.unproductive, timeSpent.rest, timeSpent.unknown];

  if (activityChart) {
    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = data;
    activityChart.data.datasets[0].backgroundColor = [customColors.productive, customColors.unproductive, customColors.rest, customColors.unknown];
    activityChart.update();
    return;
  }

  activityChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [customColors.productive, customColors.unproductive, customColors.rest, customColors.unknown],
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
    <div class="legend-item"><div style="display:flex;align-items:center;"><div class="legend-color" style="background:${customColors.unknown}"></div><span class="legend-label">Unknown</span></div><span class="legend-time">${formatTime(timeSpent.unknown)}</span></div>
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
        { label: "Rest", data: dataPoints.map(d => d.rest), backgroundColor: customColors.rest, borderRadius: 4 },
        { label: "Unknown", data: dataPoints.map(d => d.unknown), backgroundColor: customColors.unknown, borderRadius: 4 }
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
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));
  weeklyChart = buildStackedBarChart("weeklyChart", weeklyChart, last7Days, weeklyDataPoints, false);
}

function updateMonthlyCharts() {
  const weeks = getLast4Weeks();
  const monthlyDataPoints = weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
  }));
  monthlyChart = buildStackedBarChart("monthlyChart", monthlyChart, weeks, monthlyDataPoints, false);
}

function updateWeeklyFullView() {
  const last7Days = getLast7Days();
  const weeklyDataPoints = last7Days.map(day => ({
    day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));
  weeklyChartFull = buildStackedBarChart("weeklyChartFull", weeklyChartFull, last7Days, weeklyDataPoints, true);
}

function updateMonthlyFullView() {
  const weeks = getLast4Weeks();
  const monthlyDataPoints = weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
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
    logDiv.innerHTML = "";
    addLogHeader();
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

    saveLogToDatabase(currentWindowName).catch(err => {
      console.error("Failed to save log:", err);
    });

    if (lastEntry && lastTimestamp && lastEntry !== currentWindowName) {
      const timeDiff = (now - lastTimestamp) / 1000 / 60;
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

    updateChart();
    updateLegend();
    addToLog(currentWindowName, now);
    updateWeeklyCharts();
    updateMonthlyCharts();

    lastEntry = currentWindowName;
    lastTimestamp = now;
  });
}

if (window.api && window.api.onTrackingStatus) {
  window.api.onTrackingStatus(status => {
    isTracking = Boolean(status && status.isTracking);
    if (toggleTrackingBtn) {
      toggleTrackingBtn.textContent = isTracking ? "Stop Session" : "Start Session";
      toggleTrackingBtn.classList.toggle("active", isTracking);
    }
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
loadSessions();

console.log("Dashboard Loaded ✨");