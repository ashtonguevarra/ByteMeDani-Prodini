const { app, BrowserWindow, ipcMain, Menu, Notification } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");

const sleepToastIcon = path.join(__dirname, "assets", "zzz-toast.svg");

app.setName("Prodini");

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

    if (currentWindowNormalized !== lastWindow) {
      const entry = {
        timestamp: new Date().toISOString(),
        window: cw
      };

      history.push(entry);
      logToFile(entry);

            
        if (win && win.webContents) {
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
  if (process.platform === "win32") {
    // Required by Windows for reliable toast notifications.
    app.setAppUserModelId("com.bytemedani.tracker");
  }
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on("activate", () => {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  } else {
    createWindow();
  }
});

ipcMain.handle("focus-window", () => {
  try {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      return true;
    }
  } catch (error) {
    console.error("[Main] Failed to focus window:", error);
  }
  return false;
});

ipcMain.handle("show-unproductive-notification", (_, { title, body }) => {
  try {
    const notification = new Notification({
      title: title,
      body,
      silent: true,
      icon: sleepToastIcon
    });

    notification.on("click", () => {
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
        if (win.webContents) {
          win.webContents.send("show-live-tracking");
        }
      }
    });

    notification.show();
    
    return true;
  } catch (error) {
    console.error("[Notification] Failed to show notification:", error);
    return false;
  }
});
