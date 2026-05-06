const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");

let win;
let lastWindow = "";
let history = [];

let trackingInterval = null;
let isTracking = false;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("did-finish-load", () => {
    console.log("Window loaded");

    win.webContents.send("tracking-status", {
      isTracking: false
    });
  });
}

function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

async function startTracking() {
  if (isTracking) return;

  isTracking = true;

  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send("tracking-status", {
      isTracking: true
    });
  }

  trackingInterval = setInterval(async () => {
    try {
      const active = await getActiveWindow();

      if (!active) return;

      const currentWindow = active.toLowerCase().trim();

      if (currentWindow !== lastWindow) {
        const entry = {
          timestamp: new Date().toISOString(),
          window: currentWindow
        };

        history.push(entry);
        logToFile(entry);

        if (win && !win.isDestroyed() && win.webContents) {
          win.webContents.send("activity-update", {
            current: currentWindow,
            history: history.slice(-10)
          });
        }

        lastWindow = currentWindow;
      }
    } catch (err) {
      console.error("Tracking error:", err);
    }
  }, 1000);
}

function stopTracking() {
  if (!isTracking) return;

  isTracking = false;

  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send("tracking-status", {
      isTracking: false
    });
  }

  console.log("Tracking stopped");
}

ipcMain.on("start-tracking", () => {
  startTracking();
});

ipcMain.on("stop-tracking", () => {
  stopTracking();
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});