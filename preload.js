const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  startTracking: () => ipcRenderer.send("start-tracking"),
  stopTracking: () => ipcRenderer.send("stop-tracking"),

  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (event, data) => callback(data));
  },

  onTrackingStatus: (callback) => {
    ipcRenderer.on("tracking-status", (event, status) => callback(status));
  }
});