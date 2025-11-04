const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the main window
contextBridge.exposeInMainWorld('api', {
  // Function to request today's logs from the main process
  getLogs: () => ipcRenderer.invoke('get-todays-logs'),

  // Listen for a message from main.js *to* this window
  // (e.g., when a new log is saved)
  onLogsUpdated: (callback) => ipcRenderer.on('logs-updated', callback)
});

