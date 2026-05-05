const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (_, data) => callback(data));
  },
  showUnproductiveNotification: (payload) => {
    return ipcRenderer.invoke("show-unproductive-notification", payload);
  }
});