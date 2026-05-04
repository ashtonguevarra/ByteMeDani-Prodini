const currentEl = document.getElementById("current");
const logEl = document.getElementById("log");

window.api.onUpdate((data) => {
  currentEl.textContent = data.current;

  logEl.innerHTML = "";

  data.history.forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `${entry.timestamp} - ${entry.window}`;
    logEl.appendChild(div);
  });
});