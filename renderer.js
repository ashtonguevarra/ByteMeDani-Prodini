const currentEl = document.getElementById("current");
const historyEl = document.getElementById("history");
const logEl = document.getElementById("log");

//
// ✅ 1. LIVE ACTIVITY (Electron)
//
window.api.onUpdate((data) => {
  currentEl.textContent = data.current;

  historyEl.innerHTML = "";

  data.history.forEach(entry => {
    const div = document.createElement("div");
    div.className = "history-entry";

    const time = new Date(entry.timestamp).toLocaleTimeString();
    div.textContent = `[${time}] - ${entry.window}`;

    historyEl.appendChild(div);
  });
});

//
// ✅ 2. DATABASE LOGS (Flask)
//
function loadLogs() {
  fetch("http://127.0.0.1:5000/logs")
    .then(res => res.json())
    .then(data => {
      logEl.innerHTML = data.map(l =>
        `<div class="log-entry">
          ${l.app_name} - ${l.window_title}
        </div>`
      ).join("");
    })
    .catch(err => console.error("Failed to load logs:", err));
}

loadLogs();
setInterval(loadLogs, 3000);