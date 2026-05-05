const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  onUpdate: (callback) => {
    ipcRenderer.on("activity-update", (_, data) => callback(data));
  },
   setFocus: (windowName) => {
    ipcRenderer.send("set-focus", windowName);
  }
});