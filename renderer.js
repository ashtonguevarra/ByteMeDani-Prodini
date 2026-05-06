// DOM Elements
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
const breakMinutesInput = document.getElementById("breakMinutesInput");
const logDiv = document.getElementById("log");
const toggleTrackingBtn = document.getElementById("toggleTrackingBtn");

let activityChart = null;
let weeklyChart = null;
let monthlyChart = null;
let weeklyChartFull = null;
let monthlyChartFull = null;

let sessionOverrides = {};
let recentOverrideTargets = [];
let lastNonTrackerWindowName = "";

let breakActive = false;
let breakInterval = null;
let breakEndTime = null;

let currentSessionId = localStorage.getItem("currentSessionId");
let isTracking = false;

let currentFontSize = 100;
const fontSizeDisplay = document.getElementById("fontSizeModal");

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

// Date display
function updateDateDisplay() {
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

  if (dateDisplay) {
    dateDisplay.textContent = `${dateStr} • ${timeStr}`;
  }
}

updateDateDisplay();
setInterval(updateDateDisplay, 1000);

// Sidebar toggle
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

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

// Navigation
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;

    navBtns.forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    btn.classList.add("active");

    const targetView = document.getElementById(`${view}View`);
    if (targetView) {
      targetView.classList.add("active");
    }

    if (view === "weekly") updateWeeklyFullView();
    if (view === "monthly") updateMonthlyFullView();
    if (view === "history") loadSessions();
  });
});

// Break modal
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
    const minutes = parseInt(breakMinutesInput.value);

    if (isNaN(minutes) || minutes < 1) {
      alert("Please enter a valid number of minutes");
      return;
    }

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

  const now = Date.now();
  const timeLeft = breakEndTime - now;

  if (timeLeft <= 0) {
    stopBreak();
    return;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  if (breakTimerDisplay) {
    breakTimerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Log header
function addLogHeader() {
  if (logEl && !document.querySelector(".log-header")) {
    const header = document.createElement("div");
    header.className = "log-header";
    header.innerHTML = `
      <div class="log-header-app">Tab / Window Title</div>
      <div class="log-header-tab">App</div>
      <div class="log-header-time">Time</div>
    `;
    logEl.appendChild(header);
  }
}

addLogHeader();

// Font controls
const fontPlusModal = document.getElementById("fontPlusModal");
const fontMinusModal = document.getElementById("fontMinusModal");

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

function updateFontSize() {
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = currentFontSize + "%";
  }

  document.documentElement.style.fontSize = (14 * currentFontSize / 100) + "px";
}

// Color modal
const modal = document.getElementById("colorModal");
const colorBtn = document.getElementById("colorPaletteBtn");
const closeBtn = document.querySelector(".close");
const applyColorsBtn = document.getElementById("applyColors");

if (colorBtn && modal) {
  colorBtn.onclick = () => modal.style.display = "block";
}

if (closeBtn && modal) {
  closeBtn.onclick = () => modal.style.display = "none";
}

window.onclick = event => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

if (applyColorsBtn) {
  applyColorsBtn.onclick = () => {
    customColors.productive = document.getElementById("productiveColor").value;
    customColors.unproductive = document.getElementById("unproductiveColor").value;
    customColors.rest = document.getElementById("restColor").value;
    customColors.background = document.getElementById("bgColor").value;
    customColors.text = document.getElementById("textColor").value;

    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.background = customColors.background;
      mainContent.style.color = customColors.text;
    }

    updateChart();
    updateWeeklyCharts();
    updateMonthlyCharts();

    modal.style.display = "none";
  };
}

// Classification
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

let productiveApps = [...DEFAULT_PRODUCTIVE_APPS];
let unproductiveApps = [...DEFAULT_UNPRODUCTIVE_APPS];

const restApps = [
  "calendar", "reminders", "clock", "alarm", "settings",
  "spotify", "music", "apple music"
];

function extractAppAndTitle(windowTitle) {
  let appName = "";
  let tabName = "";

  if (windowTitle.includes(" - ")) {
    const parts = windowTitle.split(" - ");
    appName = parts[0];
    tabName = parts.slice(1).join(" - ");
  } else if (windowTitle.includes(" | ")) {
    const parts = windowTitle.split(" | ");
    appName = parts[parts.length - 1];
    tabName = parts.slice(0, -1).join(" | ");
  } else {
    appName = windowTitle;
    tabName = windowTitle;
  }

  appName = appName.replace(/\.exe$/i, "").trim();

  if (!tabName || tabName.trim() === "") tabName = appName;
  if (!appName || appName.trim() === "") appName = tabName;

  if (tabName.length > 50) tabName = tabName.substring(0, 47) + "...";
  if (appName.length > 25) appName = appName.substring(0, 22) + "...";

  return { tabName, appName };
}

function isTrackerWindow(windowTitle) {
  const lower = (windowTitle || "").toLowerCase();
  return lower.includes("electron") || lower.includes("tracker");
}

function categorizeApp(appName) {
  if (breakActive) return "rest";

  appName = appName.toLowerCase();

  const educationalKeywords = [
    "tutorial", "lesson", "lecture", "course", "class",
    "walkthrough", "how to", "documentation", "docs", "guide", "webinar"
  ];

  const learningIntent = educationalKeywords.some(keyword => appName.includes(keyword));

  if (
    (appName.includes("youtube") || appName.includes("facebook") || appName.includes("reddit")) &&
    learningIntent
  ) {
    return "productive";
  }

  for (const app of productiveApps) {
    if (appName.includes(app)) return "productive";
  }

  for (const app of unproductiveApps) {
    if (appName.includes(app)) return "unproductive";
  }

  for (const app of restApps) {
    if (appName.includes(app)) return "rest";
  }

  return "unknown";
}

// Session functions
async function startSession() {
  try {
    const res = await fetch("http://127.0.0.1:5000/sessions/start", {
      method: "POST"
    });

    const data = await res.json();
    currentSessionId = data.session_id;

    localStorage.setItem("currentSessionId", currentSessionId);

    console.log("Started session:", currentSessionId);
    loadSessions();
  } catch (err) {
    console.error("Failed to start session:", err);
  }
}

async function stopSession() {
  try {
    if (!currentSessionId) return;

    await fetch(`http://127.0.0.1:5000/sessions/${currentSessionId}/stop`, {
      method: "POST"
    });

    console.log("Stopped session:", currentSessionId);

    currentSessionId = null;
    localStorage.removeItem("currentSessionId");

    loadSessions();
  } catch (err) {
    console.error("Failed to stop session:", err);
  }
}

// Database save
async function saveLogToDatabase(windowTitle) {
  if (!currentSessionId) {
    console.log("No session active, log skipped");
    return;
  }

  try {
    const extracted = extractAppAndTitle(windowTitle);

    const res = await fetch("http://127.0.0.1:5000/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_id: Number(currentSessionId),
        app_name: extracted.appName,
        window_title: windowTitle
      })
    });

    const data = await res.json();
    console.log("Save log response:", data);

  } catch (err) {
    console.error("Failed to save log:", err);
  }
}

// History page
async function loadSessions() {
  const historyLog = document.getElementById("historyLog");
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

      const started = session.started_at
        ? new Date(session.started_at).toLocaleString()
        : "Unknown";

      const ended = session.ended_at
        ? new Date(session.ended_at).toLocaleString()
        : "Active";

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
  const historyLog = document.getElementById("historyLog");
  if (!historyLog) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/sessions/${sessionId}/logs`);
    const logs = await res.json();

    historyLog.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to Sessions";
    backBtn.className = "back-btn";
    backBtn.addEventListener("click", () => {
      loadSessions();
    });

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

// Main Electron update
if (window.api && window.api.onUpdate) {
  window.api.onUpdate((data) => {
    const now = new Date();
    currentWindowName = data.current || "No active window";

    saveLogToDatabase(currentWindowName);

    if (lastEntry && lastTimestamp && lastEntry !== currentWindowName) {
      const timeDiff = (now - lastTimestamp) / 1000 / 60;
      const category = categorizeApp(lastEntry);

      timeSpent[category] += timeDiff;

      const dateKey = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      if (!weeklyData[dateKey]) {
        weeklyData[dateKey] = {
          productive: 0,
          unproductive: 0,
          rest: 0,
          unknown: 0
        };
      }

      weeklyData[dateKey][category] += timeDiff;

      const monthKey = `Week ${Math.ceil(now.getDate() / 7)}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          productive: 0,
          unproductive: 0,
          rest: 0,
          unknown: 0
        };
      }

      monthlyData[monthKey][category] += timeDiff;
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

// Add live log to Home page
function addToLog(windowName, timestamp) {
  if (!logEl) return;

  const { tabName, appName } = extractAppAndTitle(windowName);

  const div = document.createElement("div");
  div.className = "log-entry current";

  const timeStr = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const category = categorizeApp(windowName);
  const categoryColor = customColors[category];

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

// Charts
function updateChartSize() {
  const chartContainer = document.querySelector(".chart-wrapper");
  const canvas = document.getElementById("activityChart");
  const windowWidth = window.innerWidth;

  if (chartContainer && canvas) {
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
}

window.addEventListener("resize", () => {
  updateChartSize();
  if (activityChart) activityChart.resize();
});

function updateChart() {
  const canvas = document.getElementById("activityChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  updateChartSize();

  const chartLabels = ["Productive", "Unproductive", "Rest", "Unknown"];
  const chartData = [
    timeSpent.productive,
    timeSpent.unproductive,
    timeSpent.rest,
    timeSpent.unknown
  ];

  if (activityChart) {
    activityChart.data.labels = chartLabels;
    activityChart.data.datasets[0].data = chartData;
    activityChart.data.datasets[0].backgroundColor = [
      customColors.productive,
      customColors.unproductive,
      customColors.rest,
      customColors.unknown
    ];
    activityChart.update();
  } else {
    activityChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: [
            customColors.productive,
            customColors.unproductive,
            customColors.rest,
            customColors.unknown
          ],
          borderWidth: 1,
          radius: "90%"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

function updateLegend() {
  const legendContainer = document.getElementById("chartLegend");
  if (!legendContainer) return;

  const formatTime = minutes => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  legendContainer.innerHTML = `
    <div class="legend-item">
      <div style="display:flex;align-items:center;">
        <div class="legend-color" style="background:${customColors.productive}"></div>
        <span class="legend-label">Productive</span>
      </div>
      <span class="legend-time">${formatTime(timeSpent.productive)}</span>
    </div>

    <div class="legend-item">
      <div style="display:flex;align-items:center;">
        <div class="legend-color" style="background:${customColors.unproductive}"></div>
        <span class="legend-label">Unproductive</span>
      </div>
      <span class="legend-time">${formatTime(timeSpent.unproductive)}</span>
    </div>

    <div class="legend-item">
      <div style="display:flex;align-items:center;">
        <div class="legend-color" style="background:${customColors.rest}"></div>
        <span class="legend-label">Rest</span>
      </div>
      <span class="legend-time">${formatTime(timeSpent.rest)}</span>
    </div>

    <div class="legend-item">
      <div style="display:flex;align-items:center;">
        <div class="legend-color" style="background:${customColors.unknown}"></div>
        <span class="legend-label">Unknown</span>
      </div>
      <span class="legend-time">${formatTime(timeSpent.unknown)}</span>
    </div>
  `;
}

function getLast7Days() {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    days.push(d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }));
  }

  return days;
}

function getLast4Weeks() {
  return ["Week 1", "Week 2", "Week 3", "Week 4"];
}

function updateWeeklyCharts() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas) return;

  const last7Days = getLast7Days();

  const weeklyDataPoints = last7Days.map(day => ({
    day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));

  const ctx = canvas.getContext("2d");

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeklyDataPoints.map(d => d.day),
      datasets: [
        {
          label: "Productive",
          data: weeklyDataPoints.map(d => d.productive),
          backgroundColor: customColors.productive,
          borderRadius: 4
        },
        {
          label: "Unproductive",
          data: weeklyDataPoints.map(d => d.unproductive),
          backgroundColor: customColors.unproductive,
          borderRadius: 4
        },
        {
          label: "Rest",
          data: weeklyDataPoints.map(d => d.rest),
          backgroundColor: customColors.rest,
          borderRadius: 4
        },
        {
          label: "Unknown",
          data: weeklyDataPoints.map(d => d.unknown),
          backgroundColor: customColors.unknown,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10 }
          }
        }
      }
    }
  });
}

function updateMonthlyCharts() {
  const canvas = document.getElementById("monthlyChart");
  if (!canvas) return;

  const last4Weeks = getLast4Weeks();

  const monthlyDataPoints = last4Weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
  }));

  const ctx = canvas.getContext("2d");

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlyDataPoints.map(d => d.week),
      datasets: [
        {
          label: "Productive",
          data: monthlyDataPoints.map(d => d.productive),
          backgroundColor: customColors.productive,
          borderRadius: 4
        },
        {
          label: "Unproductive",
          data: monthlyDataPoints.map(d => d.unproductive),
          backgroundColor: customColors.unproductive,
          borderRadius: 4
        },
        {
          label: "Rest",
          data: monthlyDataPoints.map(d => d.rest),
          backgroundColor: customColors.rest,
          borderRadius: 4
        },
        {
          label: "Unknown",
          data: monthlyDataPoints.map(d => d.unknown),
          backgroundColor: customColors.unknown,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 10 }
          }
        }
      }
    }
  });
}

function updateWeeklyFullView() {
  const canvas = document.getElementById("weeklyChartFull");
  if (!canvas) return;

  const last7Days = getLast7Days();

  const weeklyDataPoints = last7Days.map(day => ({
    day,
    productive: weeklyData[day]?.productive || 0,
    unproductive: weeklyData[day]?.unproductive || 0,
    rest: weeklyData[day]?.rest || 0,
    unknown: weeklyData[day]?.unknown || 0
  }));

  const ctx = canvas.getContext("2d");

  if (weeklyChartFull) weeklyChartFull.destroy();

  weeklyChartFull = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeklyDataPoints.map(d => d.day),
      datasets: [
        {
          label: "Productive",
          data: weeklyDataPoints.map(d => d.productive),
          backgroundColor: customColors.productive,
          borderRadius: 4
        },
        {
          label: "Unproductive",
          data: weeklyDataPoints.map(d => d.unproductive),
          backgroundColor: customColors.unproductive,
          borderRadius: 4
        },
        {
          label: "Rest",
          data: weeklyDataPoints.map(d => d.rest),
          backgroundColor: customColors.rest,
          borderRadius: 4
        },
        {
          label: "Unknown",
          data: weeklyDataPoints.map(d => d.unknown),
          backgroundColor: customColors.unknown,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  });
}

function updateMonthlyFullView() {
  const canvas = document.getElementById("monthlyChartFull");
  if (!canvas) return;

  const last4Weeks = getLast4Weeks();

  const monthlyDataPoints = last4Weeks.map(week => ({
    week,
    productive: monthlyData[week]?.productive || 0,
    unproductive: monthlyData[week]?.unproductive || 0,
    rest: monthlyData[week]?.rest || 0,
    unknown: monthlyData[week]?.unknown || 0
  }));

  const ctx = canvas.getContext("2d");

  if (monthlyChartFull) monthlyChartFull.destroy();

  monthlyChartFull = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlyDataPoints.map(d => d.week),
      datasets: [
        {
          label: "Productive",
          data: monthlyDataPoints.map(d => d.productive),
          backgroundColor: customColors.productive,
          borderRadius: 4
        },
        {
          label: "Unproductive",
          data: monthlyDataPoints.map(d => d.unproductive),
          backgroundColor: customColors.unproductive,
          borderRadius: 4
        },
        {
          label: "Rest",
          data: monthlyDataPoints.map(d => d.rest),
          backgroundColor: customColors.rest,
          borderRadius: 4
        },
        {
          label: "Unknown",
          data: monthlyDataPoints.map(d => d.unknown),
          backgroundColor: customColors.unknown,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  });
}

// Summary placeholder
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

// Existing Start / Stop button connected to sessions
if (toggleTrackingBtn) {
  toggleTrackingBtn.addEventListener("click", async () => {
    if (!isTracking) {
      await startSession();

      if (window.api && window.api.startTracking) {
        window.api.startTracking();
      }
    } else {
      await stopSession();

      if (window.api && window.api.stopTracking) {
        window.api.stopTracking();
      }
    }
  });
}

if (window.api && window.api.onTrackingStatus) {
  window.api.onTrackingStatus((status) => {
    isTracking = status.isTracking;

    if (toggleTrackingBtn) {
      toggleTrackingBtn.textContent = isTracking
        ? "Stop Session"
        : "Start Session";

      toggleTrackingBtn.classList.toggle("active", isTracking);
    }
  });
}

loadSessions();

console.log("Dashboard Loaded ✨");