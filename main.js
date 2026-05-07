// ============================================
// ACTIVITY LOGGER - MAIN PROCESS (Electron)
// ============================================
// This file manages the Electron application main process
// Responsibilities:
// - Create and manage the application window
// - Handle window tracking via IPC (Inter-Process Communication)
// - Log user activity to files and send updates to the renderer
// ============================================

const { app, BrowserWindow, ipcMain, Menu, Notification } = require("electron");
const path = require("path");
const { getActiveWindow } = require("./tracker"); // Import window tracking module
const fs = require("fs");

// ============== GLOBAL VARIABLES ==============
let win; // Reference to the main application window
let lastWindow = ""; // Track the previously active window to detect changes
let history = []; // In-memory history of active windows (last 10)

let trackingInterval = null; // Interval ID for the tracking loop
let isTracking = false; // Flag to indicate if tracking is currently active

// ============== WINDOW CREATION ==============
/**
 * Creates the main application window
 * Sets up window dimensions, security settings, and event handlers
 */
function createWindow() {
  // Create a new browser window with specified dimensions
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "assets", "icon.png"), 
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the main HTML file
  win.loadFile("index.html");

  // Clean up when window is closed
  win.on("closed", () => {
    win = null;
  });

  // Send initial tracking status when the window finishes loading
  win.webContents.on("did-finish-load", () => {
    console.log("Window loaded");

    // Notify the renderer that tracking is initially stopped
    win.webContents.send("tracking-status", {
      isTracking: false
    });
  });
}

// ============== LOGGING UTILITIES ==============
/**
 * Appends an activity log entry to the activity.log file
 * Used to persistently store all window changes
 * @param {Object} entry - The log entry containing timestamp and window info
 */
function logToFile(entry) {
  fs.appendFileSync("activity.log", JSON.stringify(entry) + "\n");
}

// ============== TRACKING FUNCTIONS ==============
/**
 * Starts the activity tracking process
 * Polls the system for active window changes every 1 second
 * Updates both the UI and activity log when window changes are detected
 */
async function startTracking() {
  // Prevent multiple tracking instances from running
  if (isTracking) return;

  isTracking = true;

  // Notify the renderer that tracking has started
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send("tracking-status", {
      isTracking: true
    });
  }

  // Set up the tracking loop - checks for active window changes every 1000ms
  trackingInterval = setInterval(async () => {
    try {
      // Get the currently active window
      const active = await getActiveWindow();

      // Skip if unable to get window information
      if (!active) return;

      // Normalize the window name for comparison
      const currentWindow = active.toLowerCase().trim();

      // Only log if the window has changed
      if (currentWindow !== lastWindow) {
        // Create a new log entry with timestamp and window name
        const entry = {
          timestamp: new Date().toISOString(),
          window: currentWindow
        };

        // Store in memory (keep only last 10 entries)
        history.push(entry);
        
        // Persist to disk for long-term storage
        logToFile(entry);

        // Send update to the renderer process (UI)
        if (win && !win.isDestroyed() && win.webContents) {
          win.webContents.send("activity-update", {
            current: currentWindow,
            history: history.slice(-10) // Send only last 10 entries
          });
        }

        // Update the last known window
        lastWindow = currentWindow;
      }
    } catch (err) {
      // Log any errors during tracking (e.g., permission issues, module errors)
      console.error("Tracking error:", err);
    }
  }, 1000); // Poll every 1 second
}

/**
 * Stops the activity tracking process
 * Clears the tracking interval and notifies the renderer
 */
function stopTracking() {
  // Prevent stopping if not tracking
  if (!isTracking) return;

  isTracking = false;

  // Clear the tracking interval
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  // Notify the renderer that tracking has stopped
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send("tracking-status", {
      isTracking: false
    });
  }

  console.log("Tracking stopped");
}

// ============== IPC EVENT HANDLERS ==============
// Listen for "start-tracking" message from the renderer process
ipcMain.on("start-tracking", () => {
  startTracking();
});

// Listen for "stop-tracking" message from the renderer process
ipcMain.on("stop-tracking", () => {
  stopTracking();
});

// Listen for "focus-app" message from the renderer process
// Brings the window to focus when notification is clicked
ipcMain.on("focus-app", () => {
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
  }
});

// Listen for "show-native-notification" message from renderer
// Displays a Windows native notification (Action Center on Windows)
ipcMain.on("show-native-notification", (event, payload = {}) => {
  try {
    if (!Notification.isSupported()) return;

    const nativeNotification = new Notification({
      title: payload.title || "Prodini Alert",
      body: payload.body || "Unproductive app duration detected.",
      silent: false
    });

    nativeNotification.on("click", () => {
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
        win.webContents.send("native-notification-click");
      }
    });

    nativeNotification.show();
  } catch (err) {
    console.error("Failed to show native notification:", err && err.message ? err.message : err);
  }
});

// ============== APPLICATION LIFECYCLE ==============
// Initialize the application when Electron is ready
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    const iconPath = path.join(__dirname, "assets", "icon.png");
    app.setAppUserModelId("com.prodini.activitytracker"); // This helps Windows recognize the icon
  }
  createWindow();
});

// Remove the default application menu (File/Edit/View...) for a cleaner UI
try {
  Menu.setApplicationMenu(null);
} catch (err) {
  console.warn("Failed to remove application menu:", err && err.message);
}

ipcMain.on("end-session-on-quit", async () => {
  // This will be called from renderer when app is closing
  console.log("Received request to end session on quit");
});

// Quit the application when all windows are closed (except on macOS)
// On macOS, applications typically remain active until the user explicitly quits
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});