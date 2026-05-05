const currentEl = document.getElementById("current");
const logEl = document.getElementById("log");
const focusList = document.getElementById("focus-list");

// =========================
// STATE (UI ONLY)
// =========================
let renderedWindows = new Set();
let windowStates = new Map(); 
// windowName -> { enabled: true/false }

// =========================
// HELPERS
// =========================
function createWindowButton(win) {
  const btn = document.createElement("button");

  // default state if new
  if (!windowStates.has(win)) {
    windowStates.set(win, {
      enabled: true,
    });
  }

  const updateUI = () => {
    const state = windowStates.get(win);

    btn.textContent = `${state.enabled ? "ON" : "OFF"} - ${win}`;
    btn.className = state.enabled ? "active" : "inactive";
  };

  updateUI();

  // =========================
  // TOGGLE TRACKING
  // =========================
  const handleToggle = () => {
    const state = windowStates.get(win);
    state.enabled = !state.enabled;

    windowStates.set(win, state);

    updateUI();

    // sync to main process
    window.api.toggleWindow(win);
  };

  btn.addEventListener("contextmenu", (e) => {
    // right-click = toggle tracking
    e.preventDefault();
    handleToggle();
  });

  // =========================
  // FOCUS SELECTION
  // =========================
  btn.addEventListener("click", () => {
    window.api.setFocus(win);
  });

  focusList.appendChild(btn);
}

// =========================
// MAIN UPDATE LOOP (FROM MAIN PROCESS)
// =========================
window.api.onUpdate((data) => {
  // -------------------------
  // CURRENT WINDOW DISPLAY
  // -------------------------
  currentEl.textContent = data.current;

  // -------------------------
  // SYNC WINDOW LIST
  // -------------------------
  const uniqueWindows = [...new Set(data.history.map(h => h.window))];

  uniqueWindows.forEach(win => {
    if (!renderedWindows.has(win)) {
      createWindowButton(win);
      renderedWindows.add(win);
    }
  });

  // -------------------------
  // LOG DISPLAY (RESPECT STATE)
  // -------------------------
  logEl.innerHTML = "";

  data.history.forEach(entry => {
    const state = windowStates.get(entry.window);

    // skip disabled apps in UI log
    if (state && state.enabled === false) return;

    const div = document.createElement("div");
    div.className = "log-entry";

    const time = new Date(entry.timestamp).toLocaleTimeString();
    div.textContent = `[${time}] - ${entry.window}`;

    logEl.appendChild(div);
  });
});