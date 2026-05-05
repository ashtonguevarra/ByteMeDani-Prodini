const { app, BrowserWindow, ipcMain, Notification, Menu } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");
const currentWindow = getActiveWindow();

let win;
let lastWindow = "";
let history = [];

let trackingStarted = false;
function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.setMenuBarVisibility(false);

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

function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

async function startTracking() {
  setInterval(async () => {
    const currentWindow = (await getActiveWindow());
    // defensive: ensure string
    const cw = (currentWindow || "").toString();
    const currentWindowNormalized = cw.toLowerCase().trim();
    console.log("active-window (raw):", cw);
    console.log("active-window (normalized):", currentWindowNormalized);

    if (currentWindowNormalized !== lastWindow) {
      const entry = {
        timestamp: new Date().toISOString(),
        window: cw
      };

      history.push(entry);
      logToFile(entry);

            
        if (win && win.webContents) {
            console.log("WIN STATUS:", win);
        win.webContents.send("activity-update", {
          current: cw,
          currentNormalized: currentWindowNormalized,
          history: history.slice(-10)
        });
        }

      lastWindow = currentWindowNormalized;
}
  }, 1000);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});

ipcMain.handle("show-unproductive-notification", (_, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
      return true;
    }
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
  return false;
});

if (win && !win.isDestroyed() && win.webContents) {
  win.webContents.send("activity-update", {
    current: currentWindow,
    history: history.slice(-10)
  });
}
