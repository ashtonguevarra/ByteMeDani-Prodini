const currentEl = document.getElementById("current");
const historyEl = document.getElementById("history");
const logEl = document.getElementById("log");

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

function loadLogs() {
  fetch("http://127.0.0.1:5000/logs")
    .then(res => res.json())
    .then(data => {
      const logDiv = document.getElementById("log");

      logDiv.innerHTML = data.map(l =>
        `<div>${l.app_name} - ${l.window_title}</div>`
      ).join("");
    })
    .catch(err => console.error("Failed to load logs:", err));
}

const dbLogEl = document.getElementById("db-log");

function loadDBLogs() {
  fetch("http://127.0.0.1:5000/logs")
    .then(res => res.json())
    .then(data => {
      dbLogEl.innerHTML = "";

      data.forEach(log => {
        const div = document.createElement("div");

        const time = new Date(log.timestamp).toLocaleTimeString();

        div.textContent = `[${time}] ${log.app_name} - ${log.window_title}`;
        dbLogEl.appendChild(div);
      });
    })
    .catch(err => {
      console.error("DB logs failed:", err);
      dbLogEl.textContent = "Failed to load database logs.";
    });
}

loadDBLogs();
setInterval(loadDBLogs, 3000);