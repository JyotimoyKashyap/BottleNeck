const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Set application name as early as possible
const APP_NAME = 'BottleNeck';
process.env.APP_NAME = APP_NAME;  // Make it available throughout the app

// Override the app name before everything else
app.name = APP_NAME;

// macOS-specific name setting
if (process.platform === 'darwin') {
    try {
        app.setName(APP_NAME);
    } catch (err) {
        console.error('Error setting app name:', err);
    }
}

// Set about panel info
app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: app.getVersion(),
    copyright: '© 2025 Jyotimoy Kashyap',
    version: app.getVersion(),
    credits: 'Created by Jyotimoy Kashyap'
});

// --- Single Instance Lock ---
// This prevents multiple instances of the app from running.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If we don't get the lock, another instance is already running.
  // Quit this new, redundant instance immediately.
  app.quit();
} else {
  // This is the primary instance.
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance. We should focus our main window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}



// Keep global references to the window objects
let mainWindow;
let popupWindow;

// --- File Saving Logic ---

// Get the path to the user's "Documents" folder
// This is cross-platform (Windows, macOS, Linux)
const documentsPath = app.getPath('documents');
// Create the path for our app-specific logs
const logFolderPath = path.join(documentsPath, 'WorkLogger', 'Logs');

function getTodaysLogPath() {
  const now = new Date();
  const year = now.getFullYear();
  // padStart ensures "5" becomes "05" for May
  const month = String(now.getMonth() + 1).padStart(2, '0'); 
  const day = String(now.getDate()).padStart(2, '0');
  
  const monthDir = path.join(logFolderPath, `${year}-${month}`);
  const logFile = path.join(monthDir, `${year}-${month}-${day}.json`);

  return { monthDir, logFile };
}

// This function handles saving the log entry
async function saveLogEntry(message) {
  const entry = {
    timestamp: new Date().toISOString(),
    description: message
  };

  const { monthDir, logFile } = getTodaysLogPath();

  try {
    // 1. Ensure the directory exists (e.g., "WorkLogger/Logs/2025-11")
    // recursive: true creates all nested folders needed
    fs.mkdirSync(monthDir, { recursive: true });

    // 2. Read existing data, or create a new array
    let dayLog = { entries: [] };
    if (fs.existsSync(logFile)) {
      const fileData = fs.readFileSync(logFile, 'utf-8');
      dayLog = JSON.parse(fileData);
    }

    // 3. Add the new entry
    dayLog.entries.push(entry);

    // 4. Write the file back
    // JSON.stringify(null, 2) makes the JSON "pretty-printed"
    fs.writeFileSync(logFile, JSON.stringify(dayLog, null, 2), 'utf-8');

    console.log(`Log saved to ${logFile}`);

    // --- ADD THIS ---
    // Notify the main window that logs have changed
    if (mainWindow) {
      mainWindow.webContents.send('logs-updated');
    }
    // --- END ---

  } catch (err) { // <-- This block was fixed
    console.error("Failed to save log:", err);
  }
}

function createMainWindow() {
  // ... (existing createMainWindow function is unchanged)
  // Get the appropriate icon path
  let iconPath = path.join(__dirname, 'build', 'icons', 'png/512x512.png');
  // Only use the icon if it exists
  if (!fs.existsSync(iconPath)) {
    iconPath = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: APP_NAME,
    icon: iconPath,
    show: false, // Don't show the window until it's ready
    webPreferences: {
      // --- MODIFY THIS ---
      // We'll add a preload script later
      preload: path.join(__dirname, 'preload.js'), // <-- Add this line
      contextIsolation: true, // <-- Add this line
      nodeIntegration: false  // <-- Add this line
      // --- END ---
    },
  });

  mainWindow.loadFile('index.html');
  
  // Show window when it's ready to avoid flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent window from being destroyed on close (macOS)
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createPopupWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Get the appropriate icon path (reuse the same icon)
  let iconPath = path.join(__dirname, 'build', 'icons', 'png/512x512.png');
  // Only use the icon if it exists
  if (!fs.existsSync(iconPath)) {
    iconPath = undefined;
  }

  popupWindow = new BrowserWindow({
    width: 500,
    height: 80, // Adjusted height for a single input
    x: Math.floor((width - 500) / 2),
    y: Math.floor((height - 80) / 2),
    title: `${APP_NAME} - Quick Entry`,
    icon: iconPath,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      // Connect the preload script
      preload: path.join(__dirname, 'popupPreload.js'),
      // These are good security defaults
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  popupWindow.loadFile('popup.html');

  popupWindow.on('blur', () => {
    if (popupWindow.isVisible()) {
      popupWindow.hide();
    }
  });
}

// --- App Lifecycle & Shortcuts ---

app.whenReady().then(() => {
  // Set the app name again after ready
  if (process.platform === 'darwin') {
    // Try multiple methods to set the app name
    app.name = APP_NAME;
    app.setName(APP_NAME);
    
    // Try to set the dock icon if it exists
    const iconPath = path.join(__dirname, 'build', 'icons', 'png/512x512.png');
    if (fs.existsSync(iconPath)) {
      app.dock.setIcon(iconPath);
    }

    // Force a dock refresh by briefly hiding and showing
    const isDockVisible = !app.dock.isVisible();
    if (isDockVisible) {
      app.dock.hide();
      app.dock.show();
    }
  }
  
  createMainWindow();
  createPopupWindow();

  const ret = globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (popupWindow.isVisible()) {
      popupWindow.hide();
    } else {
      popupWindow.show();
      popupWindow.focus();
    }
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  }

  app.on('activate', () => {
    // If the window exists but is hidden, show it
    if (mainWindow) {
      mainWindow.show();
    } else {
      // If the window doesn't exist, create it
      createMainWindow();
    }
  });
});

// Handle the 'before-quit' event
app.on('before-quit', () => {
  // Set a flag so we know we're actually quitting
  app.isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Only quit the app on non-macOS platforms
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // On macOS, the app should stay active until explicitly quit
});

// --- IPC Listeners (Handling messages from windows) ---

// Listen for the 'save-log' message from the popup
ipcMain.handle('save-log', async (event, message) => {
  await saveLogEntry(message);
  // We could return a value here if we wanted
});

// Listen for the 'hide-popup' message
ipcMain.on('hide-popup', () => {
  if (popupWindow) {
    popupWindow.hide();
  }
});

// --- ADD THIS NEW LISTENER ---
// Listen for the main window asking for today's logs
ipcMain.handle('get-todays-logs', async () => {
  const { logFile } = getTodaysLogPath();

  if (fs.existsSync(logFile)) {
    try {
      const fileData = fs.readFileSync(logFile, 'utf-8');
      return JSON.parse(fileData); // Returns { entries: [...] }
    } catch (err) {
      console.error("Failed to read log file:", err);
      return { entries: [] }; // Return empty on error
    }
  }
  
  // If file doesn't exist, return an empty log
  return { entries: [] };
});
// --- END ---

