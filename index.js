'use strict';
const electron = require('electron');
const path = require('path');
const appMenu = require('./menu');
const windowStateKeeper = require('electron-window-state');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const Tray = electron.Tray;

let mainWindow;
let appIcon;
let mainWindowState = windowStateKeeper('main', {
  width: 1000,
  height: 800
});

function updateBadge(title) {
  let isOSX = !!app.dock;

  const messageCount = (/\(([0-9]+)\)/).exec(title);

  if (isOSX) {
    app.dock.setBadge(messageCount ? messageCount[1] : '');
    if (messageCount) {
      app.dock.bounce('informational');
    }
  }

  if (messageCount) {
    appIcon.setImage(path.join(__dirname, 'media', 'logo-tray-blue.png'));
  } else {
    appIcon.setImage(path.join(__dirname, 'media', 'logo-tray.png'));
  }
}

function createMainWindow() {
  const win = new BrowserWindow({
    'title': app.getName(),
    'show': false,
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    'minWidth': 400,
    'minHeight': 200,
    'webPreferences': {
      'nodeIntegration': false,
      'webSecurity': false,
      'plugins': true
    }
  });

  if (mainWindowState.isMaximized) {
    win.maximize();
  }

  win.loadURL('https://web.whatsapp.com', {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36'
  });
	win.on('closed', () => app.quit);
	win.on('page-title-updated', (e, title) => updateBadge(title));
  win.on('close', (e) => {
    if (process.platform === 'darwin' && !win.forceClose) {
      e.preventDefault();
      win.hide();
    } else {
      mainWindowState.saveState(win);
    }
  });
  return win;
}

function createTray() {
  appIcon = new Tray(path.join(__dirname, 'media', 'logo-tray.png'));
  appIcon.setPressedImage(path.join(__dirname, 'media', 'logo-tray-white.png'));
  appIcon.setContextMenu(appMenu.trayMenu);

  appIcon.on('double-click', () => {
  	mainWindow.show();
  });
}

app.on('ready', () => {
  electron.Menu.setApplicationMenu(appMenu.mainMenu);

  mainWindow = createMainWindow();
  createTray();

  const page = mainWindow.webContents;

  page.on('dom-ready', () => {
    mainWindow.show();
  });

  page.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  page.on('did-finish-load', () => {
    mainWindow.setTitle(app.getName());
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  mainWindow.forceClose = true;
});

app.on('activate-with-no-open-windows', () => {
  mainWindow.show();
});
