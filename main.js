// Pomus as a small always-on-top Electron window.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// One-time import of timer state and history from the old Chrome app profile.
function importChromeData() {
  const dest = path.join(app.getPath('userData'), 'Local Storage');
  if (fs.existsSync(dest)) return;
  const old = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Application Support/pomus-chrome')
    : path.join(os.homedir(), '.config/pomus-chrome');
  const src = path.join(old, 'Default/Local Storage');
  if (!fs.existsSync(src)) return;
  try {
    fs.cpSync(src, dest, { recursive: true, filter: (f) => path.basename(f) !== 'LOCK' });
  } catch {}
}

if (!app.requestSingleInstanceLock()) app.quit();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 350,
    height: 550,
    useContentSize: true,
    title: 'Pomus',
    icon: path.join(__dirname, 'art/icon.png'),
    alwaysOnTop: true,
    backgroundColor: '#f3efe0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // keep the timer and alarm on time when hidden
    },
  });
  if (process.platform !== 'darwin') win.removeMenu();
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.on('resize', (_e, w, h) => win && win.setContentSize(w, h));

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  if (app.dock) app.dock.setIcon(path.join(__dirname, 'art/icon.png'));
  importChromeData();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
