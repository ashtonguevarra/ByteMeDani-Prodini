const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker");
const fs = require("fs");
const notifier = require("node-notifier");

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

ipcMain.handle("show-unproductive-notification", (_, { title, body }) => {
  try {
    console.log("[Notification] Creating notification with node-notifier");
    
    const notification = notifier.notify({
      title: title,
      message: body,
      sound: false,
      wait: true,
      appID: "com.bytemedani.tracker"
    }, (err, response, metadata) => {
      if (err) {
        console.error("[Notification] Error:", err);
        return;
      }
      console.log("[Notification] Response from notifier:", response);
      
      if (response === "activate" || response === "clicked") {
        console.log("[Notification] User clicked notification");
        if (win && !win.isDestroyed()) {
          console.log("[Notification] Focusing window and sending IPC");
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
          setTimeout(() => {
            if (win && !win.isDestroyed()) {
              win.webContents.send("unproductive-notification-clicked");
            }
          }, 100);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error("[Notification] Failed to show notification:", error);
    return false;
  }
});
