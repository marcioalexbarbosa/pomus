// Exposes the few window controls the page needs.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomus', {
  resize: (w, h) => ipcRenderer.send('resize', w, h),
});
