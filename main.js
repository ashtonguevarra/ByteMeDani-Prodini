const { app, BrowserWindow } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");

let win;
let lastWindow = "";
let history = [];

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("index.html");
}

function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

async function startTracking() {
  setInterval(async () => {
    const currentWindow = await getActiveWindow();

    if (currentWindow !== lastWindow) {
      const entry = {
        timestamp: new Date().toISOString(),
        window: currentWindow
      };

      history.push(entry);
      logToFile(entry);

      // Send to UI
      win.webContents.send("activity-update", {
        current: currentWindow,
        history: history.slice(-10)
      });

      lastWindow = currentWindow;
    }
  }, 1000);
}

app.whenReady().then(() => {
  createWindow();
  startTracking();
});