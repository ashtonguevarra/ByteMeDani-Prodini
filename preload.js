const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (_, data) => callback(data));
  }
});