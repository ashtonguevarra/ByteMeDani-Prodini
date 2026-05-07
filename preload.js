// ============================================
// PRELOAD SCRIPT - SECURE IPC BRIDGE
// ============================================
// This script provides secure communication between the main process and renderer
// It uses contextBridge to expose only safe APIs without full Node integration
// This prevents security vulnerabilities by controlling what the renderer can access
// ============================================

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose a safe API object to the renderer process
 * The renderer can only call these methods, ensuring security
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Send a message to start tracking from the renderer
   * The main process will listen for "start-tracking" on ipcMain
   */
  startTracking: () => ipcRenderer.send("start-tracking"),

  /**
   * Send a message to stop tracking from the renderer
   * The main process will listen for "stop-tracking" on ipcMain
   */
  stopTracking: () => ipcRenderer.send("stop-tracking"),

  /**
   * Register a callback to receive activity updates from the main process
   * Called whenever the active window changes
   * @param {Function} callback - Function to call with activity data {current, history}
   */
  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (event, data) => callback(data));
  },

  /**
   * Register a callback to receive tracking status changes from the main process
   * Called when tracking is started or stopped
   * @param {Function} callback - Function to call with status data {isTracking}
   */
  onTrackingStatus: (callback) => {
    ipcRenderer.on("tracking-status", (event, status) => callback(status));
  }
});