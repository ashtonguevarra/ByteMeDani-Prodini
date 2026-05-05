const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./lintracker"); // or ./tracker for Windows
const fs = require("fs");
const notifier = require("node-notifier");

let win;
let lastWindow = "";
let history = [];

// 🔥 Focus tracking
let focusWindow = null;
let awayStart = null;
const AWAY_LIMIT = 5 * 1000; // 5 minutes

let trackingStarted = false;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("index.html");

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("did-finish-load", () => {
    console.log("Window loaded");

    if (!trackingStarted) {
      startTracking();
      trackingStarted = true;
    }
  });
}

// 📁 Save logs
function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

// 🔔 Notification
function triggerNotification() {
  notifier.notify({
    title: "Stay Focused",
    message: "You've been away for too long. Return to your task?",
    wait: true // needed for actions to work
  });
}

// 🎯 Handle focus selection from UI
ipcMain.on("set-focus", (_, windowName) => {
  focusWindow = windowName.toLowerCase();
  awayStart = null; // reset timer
  console.log("Focus set to:", focusWindow);
});


async function startTracking() {
  setInterval(async () => {
    let currentWindow = await getActiveWindow();

    if (!currentWindow) return;

    currentWindow = currentWindow.toLowerCase().trim();

    // ✅ Always send updates to UI
    if (win && win.webContents) {
      win.webContents.send("activity-update", {
        current: currentWindow,
        history: history.slice(-10),
        focusWindow
      });
    }

    // ✅ Only log when window changes
    if (currentWindow !== lastWindow) {
      const entry = {
        timestamp: new Date().toISOString(),
        window: currentWindow
      };

      history.push(entry);
      logToFile(entry);

      lastWindow = currentWindow;
    }

    // 🔥 Focus logic
    if (focusWindow) {
      if (currentWindow.includes(focusWindow)) {
        // User is on focus → reset timer
        awayStart = null;
      } else {
        // User left focus
        if (!awayStart) {
          awayStart = Date.now();
        } else {
          const awayTime = Date.now() - awayStart;

          if (awayTime > AWAY_LIMIT) {
            triggerNotification();
            awayStart = null; // reset after alert
          }
        }
      }
    }

  }, 1000);
}

// 🚀 Start app
app.whenReady().then(() => {
  createWindow();
});

