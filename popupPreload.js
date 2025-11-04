const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the popup window
contextBridge.exposeInMainWorld('api', {
  // This function will send the log message to the main process
  sendLog: (message) => ipcRenderer.invoke('save-log', message),
  
  // A function to tell the main process to hide the popup
  hideWindow: () => ipcRenderer.send('hide-popup'),
});

