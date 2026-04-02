import { app, BrowserWindow, Menu, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const fs = require('fs');

import './server'

let mainWindowId = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'images/Icon.png'),
  });
  mainWindow.maximize();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  mainWindow.removeMenu();
  mainWindowId = mainWindow.id;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  const cachePath = path.join(app.getPath('userData'), 'adblocker-engine.bin');

  try {
    const { ElectronBlocker } = await import('@ghostery/adblocker-electron');
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
      path: cachePath,
      read: fs.promises.readFile,
      write: fs.promises.writeFile,
    });
    blocker.enableBlockingInSession(session.defaultSession);
    console.log('Adblocker loaded successfully');
  } catch (error) {
    console.warn('Adblocker unavailable, continuing without it:', error?.message || error);
  }
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('browser-window-created', (_, window) => {
  window.setAutoHideMenuBar(true);
  window.removeMenu();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    const sourceWindow = BrowserWindow.fromWebContents(contents);
    const isMainWindow = sourceWindow?.id === mainWindowId;
    const isHttpUrl = url.startsWith('http://') || url.startsWith('https://');

    if (!isMainWindow) {
      console.log('Pop-up bloqueado em janela secundaria:', url);
      return { action: 'deny' };
    }

    if (isHttpUrl) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1200,
          height: 800,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      };
    }

    console.log('Pop-up safado bloqueado:', url);
    return { action: 'deny' };
  });
});