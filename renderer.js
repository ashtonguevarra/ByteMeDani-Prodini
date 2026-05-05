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
const breakMinutesInput = document.getElementById("breakMinutesInput");

let activityChart = null;
let weeklyChart = null;
let monthlyChart = null;
let weeklyChartFull = null;
let monthlyChartFull = null;

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
  const minutes = parseInt(breakMinutesInput.value);
  if (isNaN(minutes) || minutes < 1) {
    alert("Please enter a valid number of minutes");
    return;
  }
  
  breakActive = true;
  breakEndTime = Date.now() + (minutes * 60 * 1000);
  
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
const productiveApps = [
  'vscode', 'visual studio', 'cursor', 'intellij', 'pycharm', 
  'terminal', 'notion', 'figma', 'excel', 'word', 'code', 'brave', 'chrome', 'firefox'
];

const unproductiveApps = [
  'youtube', 'twitter', 'facebook', 'instagram', 'reddit', 
  'twitch', 'tiktok', 'netflix', 'hulu'
];

const restApps = [
  'calendar', 'reminders', 'clock', 'alarm', 'settings', 
  'spotify', 'music', 'apple music'
];

function categorizeApp(appName) {
  if (breakActive) return 'rest';
  
  appName = appName.toLowerCase();
  for (const app of productiveApps) if (appName.includes(app)) return 'productive';
  for (const app of unproductiveApps) if (appName.includes(app)) return 'unproductive';
  for (const app of restApps) if (appName.includes(app)) return 'rest';
  return 'productive';
}

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
let timeSpent = { productive: 0, unproductive: 0, rest: 0 };
let weeklyData = {};
let monthlyData = {};
let lastEntry = null;
let lastTimestamp = null;
let currentWindowName = "";

addLogHeader();

window.api.onUpdate((data) => {
  const now = new Date();
  currentWindowName = data.current || "No active window";
  
  if (lastEntry && lastTimestamp && lastEntry !== currentWindowName) {
    const timeDiff = (now - lastTimestamp) / 1000 / 60;
    const category = categorizeApp(lastEntry);
    timeSpent[category] += timeDiff;
    
    const dateKey = now.toDateString();
    if (!weeklyData[dateKey]) weeklyData[dateKey] = { productive: 0, unproductive: 0, rest: 0 };
    weeklyData[dateKey][category] += timeDiff;
    
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { productive: 0, unproductive: 0, rest: 0 };
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
  
  if (activityChart) {
    activityChart.data.datasets[0].data = [timeSpent.productive, timeSpent.unproductive, timeSpent.rest];
    activityChart.update();
  } else {
    activityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Productive', 'Unproductive', 'Rest'],
        datasets: [{
          data: [timeSpent.productive, timeSpent.unproductive, timeSpent.rest],
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
    rest: weeklyData[day]?.rest || 0
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
    rest: monthlyData[week]?.rest || 0
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
    rest: weeklyData[day]?.rest || 0
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
    rest: monthlyData[week]?.rest || 0
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