const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");

let win;
let lastWindow = "";
let history = [];

let trackingInterval = null;
let isTracking = false;

let pythonProcess = null;

/* -----------------------------
   START FLASK BACKEND
----------------------------- */

function startBackend() {
  const isWindows = process.platform === "win32";

  const pythonPath = isWindows
    ? path.join(__dirname, "backend", "venv", "Scripts", "python.exe")
    : path.join(__dirname, "backend", "venv", "bin", "python");

  const backendPath = path.join(__dirname, "backend", "app.py");

  pythonProcess = spawn(pythonPath, [backendPath]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[FLASK]: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[FLASK ERROR]: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Flask process exited with code ${code}`);
  });
}

/* -----------------------------
   CREATE WINDOW
----------------------------- */

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

/* -----------------------------
   LOGGING
----------------------------- */

function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

/* -----------------------------
   TRACKING
----------------------------- */

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

      const currentWindow = active.trim();

      console.log("Detected window:", currentWindow);

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

/* -----------------------------
   IPC EVENTS
----------------------------- */

ipcMain.on("start-tracking", () => {
  startTracking();
});

ipcMain.on("stop-tracking", () => {
  stopTracking();
});

/* -----------------------------
   APP START
----------------------------- */

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

/* -----------------------------
   APP CLOSE
----------------------------- */

app.on("window-all-closed", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});