const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (_, data) => callback(data));
  },
  onShowLiveTracking: (callback) => {
    ipcRenderer.on("show-live-tracking", () => callback());
  },
  showUnproductiveNotification: (payload) => {
    return ipcRenderer.invoke("show-unproductive-notification", payload);
  }
});