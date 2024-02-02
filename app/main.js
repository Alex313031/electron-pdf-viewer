const fs = require('fs');
const path = require('path');
const { app, session, BrowserWindow, crashReporter, nativeTheme, nativeImage, Menu, Tray, shell, dialog } = require('electron');
const config = require('./config');
const contextMenu = require('electron-context-menu');
const electronLog = require('electron-log');
const Store = require('electron-store');
const options = { extraHeaders: 'pragma: no-cache\n' };
const appIcon = config.iconPath;
const trayIcon = config.trayIconPath;
const argsCmd = process.argv; // Global cmdline object.
// const argsCmd2 = process.argv[2]; // (2nd) Global cmdline object.
const menu = require('./menu.js');
const store = new Store();
const userDataDir = app.getPath('userData');
let mainWindow;
let splashwindow;
let trayMenu = null;
let filepath = null;

// Get version info
const appName = app.getName();
const appVersion = app.getVersion();
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

// Initialize Electron remote module
require('@electron/remote/main').initialize();

// Restrict main.log size to 100Kb
electronLog.transports.file.maxSize = 1024 * 100;

app.setName(config.appName);
app.setAboutPanelOptions({
  applicationName: config.appName,
  applicationVersion: config.appVersion,
  copyright: config.copyrightInfo,
  version: config.appVersion,
  credits: config.author,
  authors: [config.author],
  website: config.website,
  iconPath: config.iconPath
});
crashReporter.start({
  productName: config.appName,
  companyName: config.author,
  uploadToServer: false,
  autoSubmit: false
});
forceSingleInstance();

function resetWindow(window) {
  if (window == null) {
    return
  }
  window.webContents.clearHistory();
  if (window.webContents.session) {
    window.webContents.session.clearAuthCache();
    window.webContents.session.clearCache();
    window.webContents.session.clearHostResolverCache();
    window.webContents.session.clearStorageData();
    window.webContents.session.closeAllConnections();
  }
}

function forceSingleInstance() {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // If someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });
  }
}

function showSplashWindow() {
  splashwindow = new BrowserWindow({
    accessibleTitle: config.appName,
    title: config.appName,
    icon: appIcon,
    width: 400,
    height: 300,
    //center: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false
  });
  splashwindow.setOverlayIcon(appIcon, config.appName);
  splashwindow.loadURL('file://' + __dirname + '/splash.html', options);
}

function hideSplashWindow() {
  splashwindow.close();
  splashwindow = null;
}

function createMainWindow() {
  // Create the main window.
  mainWindow = new BrowserWindow({
    accessibleTitle: config.appName,
    title: config.appName,
    icon: appIcon,
    resizable: true,
    maximizable: true,
    minWidth: 400,
    minHeight: 300,
    width: 1024,
    height: 800,
    useContentSize: true,
    autoHideMenuBar: false,
    darkTheme: true,
    show: false,
    toolbar: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      sandbox: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      defaultEncoding: 'UTF-8'
    }
  });
  mainWindow.setOverlayIcon(appIcon, config.appName);
  resetWindow(mainWindow);
  mainWindow.on('close', function (e) {
    mainWindow.webContents.clearHistory();
    mainWindow.webContents.session.clearCache(function () {
        mainWindow.destroy();
    });
  });
  mainWindow.on('closed', function () {
    mainWindow = null;
    app.quit();
  });
  //mainWindow.webContents.on('new-window', function (e, url) {
  //    e.preventDefault();
  //    shell.openExternal(url);
  //});
  mainWindow.loadURL('file://' + __dirname + '/index.html', options);
  require('@electron/remote/main').enable(mainWindow.webContents);
  mainWindow.once('ready-to-show', () => {
    hideSplashWindow();
    mainWindow.show();
    mainWindow.focus();
  });
}

contextMenu({
  // Chromium context menu defaults
  showSelectAll: true,
  showCopyImage: true,
  showCopyImageAddress: true,
  showSaveImageAs: true,
  showCopyVideoAddress: true,
  showSaveVideoAs: true,
  showCopyLink: true,
  showSaveLinkAs: true,
  showInspectElement: true,
  showLookUpSelection: true,
  showSearchWithGoogle: true,
  prepend: (defaultActions, parameters) => [
  {
    label: 'Open Video in New Window',
    // Only show it when right-clicking video
    visible: parameters.mediaType === 'video',
    click: () => {
      const newWin = new BrowserWindow({
      title: 'New Window',
      width: 1024,
      height: 768,
      useContentSize: true,
      darkTheme: true,
      webPreferences: {
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        experimentalFeatures: true,
        devTools: true
      }
      });
      const vidURL = parameters.srcURL;
      newWin.loadURL(vidURL);
    }
  },
  {
    label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: () => {
      const newWin = new BrowserWindow({
      title: 'New Window',
      width: 1024,
      height: 768,
      useContentSize: true,
      darkTheme: true,
      webPreferences: {
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        experimentalFeatures: true,
        devTools: true
      }
      });
      const toURL = parameters.linkURL;
      newWin.loadURL(toURL);
    }
  }]
});

function handleOpenFile() {
  let path = dialog.showOpenDialogSync({
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    properties: ['openFile']
  });
  if (path) {
    if (path.constructor === Array)
      path = path[0];
      filepath = path;
      mainWindow.loadURL('file://' + __dirname + '/pdfviewer/web/viewer.html?file=' + encodeURIComponent(filepath), options);
  }
}

const trayMenuTemplate = [
  { label: 'Minimize', type: 'radio', role: 'minimize' },
  { type: 'separator' },
  { label: 'Exit', type: 'radio', role: 'quit' },
]

// Fire it up
app.whenReady().then(async() => {
  showSplashWindow();
  electronLog.info('Welcome to ' + appName);
  let tray = new Tray(trayIcon);
  trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setToolTip(config.appName);
  tray.setContextMenu(trayMenu);
  Menu.setApplicationMenu(menu(store, mainWindow, app));
  // for MacOS
  if (app.dock) {
    app.dock.setIcon(appIcon);
    app.dock.setMenu(trayMenu);
  }
  // hide splash screen randomly after ~1.2 seconds
  setTimeout(createMainWindow, (Math.random() + 2) * 600);
});

// Full restart, quitting Electron. Triggered by developer menu
app.on('restart', () => {
  electronLog.warn('Restarting Electron...');

  store.set('relaunch.windowDetails', {
    position: mainWindow.getPosition(),
    size: mainWindow.getSize()
  });
  // Close App
  mainWindow.close();
  // Tell app we are going to relaunch
  app.relaunch();
  // Kill Electron to initiate the relaunch
  app.quit();
});

// Dialog box asking if user really wants to restart app
// Emitted from certain menu items that require an Electron restart
app.on('restart-confirm', () => {
  dialog.showMessageBox(mainWindow, {
    'type': 'question',
    'title': 'Restart Confirmation',
    'message': 'Are you sure you want to restart the app?',
    'buttons': [
      'Yes',
      'No'
    ]
  })
  // Dialog returns a promise so let's handle it correctly
  .then((result) => {
    // Bail if the user pressed "No" or escaped (ESC) from the dialog box
    if (result.response !== 0) { return; }
    // Testing.
    if (result.response === 0) {
      //console.log('The "Yes" button was pressed (main process)');
      //app.relaunch();
      //app.quit();
      app.emit('restart');
    }
  })
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  electronLog.warn(appName + ' is quitting now');
});

app.on('activate', function () {
  // On MacOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Append some Chromium command-line switches for GPU acceleration and other features
app.commandLine.appendSwitch('enable-local-file-accesses');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('enable-ui-devtools');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-features', 'CSSColorSchemeUARendering,ImpulseScrollAnimations,ParallelDownloading,Portals,StorageBuckets,JXL');
// Enable remote debugging only if we in development mode
if (process.env.NODE_ENV === 'development') {
  const portNumber = '9222'
  app.commandLine.appendSwitch('remote-debugging-port', portNumber);
  electronLog.warn('Remote debugging open on port ' + [ portNumber ]);
}

// Called on disallowed remote APIs below
function rejectEvent(event) {
  event.preventDefault();
}

/* Restrict certain Electron APIs in the renderer process for security */
app.on('remote-require', rejectEvent);
