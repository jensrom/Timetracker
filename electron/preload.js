const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  dbRead: (dbPath) => ipcRenderer.invoke('db-read', dbPath),
  dbWrite: (dbPath, data) => ipcRenderer.invoke('db-write', dbPath, data),
  getDefaultDbPath: () => ipcRenderer.invoke('get-default-db-path'),
});
