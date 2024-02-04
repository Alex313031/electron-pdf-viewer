const { app, BrowserWindow, crashReporter, Menu, nativeTheme, Tray, shell, ipcMain, dialog } = require('electron');
const config = require('./config');
const path = require('path');
const contextMenu = require('electron-context-menu');
const electronLog = require('electron-log');
const Store = require('electron-store');
const options = { extraHeaders: 'pragma: no-cache\n' };
const appIcon = config.iconPath;
const trayIcon = config.trayIconPath;
const argsCmd = process.argv;
const argsCmd2 = process.argv[2];
const menu = require('./menu.js');
const store = new Store();
let mainWindow;
let newWindow;
let showSplash;
let splashWindow;
let trayMenu = null;
let filePath = null;

// Get version info
const appName = app.getName();
const appVersion = app.getVersion();
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;
const pdfjsVer = "4.0.379";

// Initialize Electron remote module
require('@electron/remote/main').initialize();

// Restrict main.log size to 100Kb
electronLog.transports.file.maxSize = 1024 * 100;

app.setName(appName);
app.setAboutPanelOptions({
  applicationName: appName,
  applicationVersion: appVersion,
  copyright: config.copyrightInfo,
  version: appVersion,
  credits: config.author,
  authors: [config.author],
  website: config.website,
  iconPath: config.iconPath
});
crashReporter.start({
  productName: appName,
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
    app.on('second-instance', () => {
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

async function showSplashWindow() {
  splashWindow = new BrowserWindow({
    accessibleTitle: appName,
    title: appName,
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

  splashWindow.on('close', () => {
    if (splashWindow) {
      store.set('splashWindowDetails', {
        position: splashWindow.getPosition(),
      });
      electronLog.info('Saved splashWindowDetails.');
    } else {
      electronLog.error('Error: spashWindow was not defined while trying to save windowDetails.');
    }
  });

  const splashWindowDetails = store.get('splashWindowDetails');
  if (splashWindowDetails) {
    splashWindow.setPosition(
      splashWindowDetails.position[0],
      splashWindowDetails.position[1]
    );
  } else {
    splashWindow.setSize(400, 300);
  }

  splashWindow.setOverlayIcon(appIcon, appName);
  splashWindow.loadURL('file://' + __dirname + '/splash.html', options);
}

function hideSplashWindow() {
  splashWindow.close();
  splashWindow = null;
}

async function createMainWindow() {
  // Create the main window.
  mainWindow = new BrowserWindow({
    accessibleTitle: appName,
    title: appName,
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
      contextIsolation: false,
      sandbox: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      defaultEncoding: 'UTF-8',
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.setOverlayIcon(appIcon, appName);
  resetWindow(mainWindow);

  nativeTheme.themeSource = 'dark';

  mainWindow.on('close', () => {
    mainWindow.webContents.clearHistory();
    if (mainWindow) {
      store.set('windowDetails', {
        position: mainWindow.getPosition(),
        size: mainWindow.getSize()
      });
      electronLog.info('Saved windowDetails.');
    } else {
      electronLog.error('Error: mainWindow was not defined while trying to save windowDetails.');
    }
    mainWindow.webContents.session.clearCache(function () {
      mainWindow.destroy();
    });
  });

  const windowDetails = store.get('windowDetails');
  if (windowDetails) {
    mainWindow.setSize(
      windowDetails.size[0],
      windowDetails.size[1]
    );
    mainWindow.setPosition(
      windowDetails.position[0],
      windowDetails.position[1]
    );
  } else {
    mainWindow.setSize(1024, 800);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html', options);
  require('@electron/remote/main').enable(mainWindow.webContents);

  mainWindow.once('ready-to-show', () => {
    if (showSplash == false) {
      electronLog.info('Not showing splashWindow');
      mainWindow.show();
      mainWindow.focus();
    } else {
      hideSplashWindow();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function createNewWindow() {
  // Create a new window.
  newWindow = new BrowserWindow({
    accessibleTitle: appName,
    title: appName + ' (New Instance)',
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
      contextIsolation: false,
      sandbox: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      defaultEncoding: 'UTF-8',
      preload: path.join(__dirname, 'preload.js')
    }
  });
  //newWindow.setOverlayIcon(appIcon, appName);
  resetWindow(newWindow);

  nativeTheme.themeSource = 'dark';

  const windowDetails = store.get('windowDetails');
  if (windowDetails) {
    newWindow.setSize(
      windowDetails.size[0],
      windowDetails.size[1]
    );
    newWindow.setPosition(
      windowDetails.position[0],
      windowDetails.position[1]
    );
  } else {
    newWindow.setSize(1024, 800);
  }

  newWindow.on('closed', () => {
    newWindow = null;
  });

  newWindow.loadURL('file://' + __dirname + '/index.html', options);
  require('@electron/remote/main').enable(newWindow.webContents);

  newWindow.once('ready-to-show', () => {
    newWindow.show();
    newWindow.focus();
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
    label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: () => {
      const toURL = parameters.linkURL;
      const linkWin = new BrowserWindow({
        title: 'New Window',
        width: 1024,
        height: 700,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      linkWin.loadURL(toURL);
      electronLog.info('Opened Link in New Window');
    }
  },
  {
    label: 'Open Image in New Window',
    // Only show it when right-clicking an image
    visible: parameters.mediaType === 'image',
    click: () => {
      const imgURL = parameters.srcURL;
      const imgTitle = imgURL.substring(imgURL.lastIndexOf('/') + 1);
      const imgWin = new BrowserWindow({
        title: imgTitle,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      imgWin.loadURL(imgURL);
      electronLog.info('Opened Image in New Window');
    }
  },
  {
    label: 'Open Video in New Window',
    // Only show it when right-clicking a video
    visible: parameters.mediaType === 'video',
    click: () => {
      const vidURL = parameters.srcURL;
      const vidTitle = vidURL.substring(vidURL.lastIndexOf('/') + 1);
      const vidWin = new BrowserWindow({
        title: vidTitle,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      vidWin.loadURL(vidURL);
      electronLog.info('Popped out Video');
    }
  }]
});

app.on('new-window', () => {
  createNewWindow();
  electronLog.info('Created new BrowserWindow');
  newWindow.webContents.once('dom-ready', () => {
      newWindow.setTitle(appName + ' (New Instance)');
  });
});

app.on('handle-open-file-path', () => {
  shell.showItemInFolder(filePath);
  electronLog.info('Opened containing filepath of: ' + filePath);
});

app.on('handle-open-file', () => {
  handleOpenFile();
});

ipcMain.on('ipc-open-file', () => {
  handleOpenFile();
});

function handleOpenFile() {
  var windowToLoad = BrowserWindow.getFocusedWindow();
  let path = dialog.showOpenDialogSync({
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    properties: ['openFile']
  });
  if (path) {
    if (path.constructor === Array) {
      path = path[0];
      filePath = path;
      windowToLoad.loadURL('file://' + __dirname + '/pdfviewer/web/viewer.html?file=' + encodeURIComponent(filePath), options);
      electronLog.info('Opened file: ' + filePath);
    }
  }
}

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

const trayMenuTemplate = [
  { label: 'Minimize',
    type: 'radio',
    role: 'minimize',
    click() {
      mainWindow.minimize();
      electronLog.info('Minimized mainWindow');
    }
  },
  { label: 'Restore',
    type: 'radio',
    role: 'restore',
    click() {
      mainWindow.restore();
      electronLog.info('Restored mainWindow');
    }
  },
  { type: 'separator' },
  { label: 'Exit',
    type: 'radio',
    role: 'quit'
  }
]

// Fire it up
app.whenReady().then(async() => {
  // Show versions
  if (argsCmd.includes('--version') || argsCmd.includes('-v')) {
    console.log('\n  ' + appName + ' Version: ' + appVersion);
    console.log('  Electron Version: ' + electronVer);
    console.log('  Chromium Version: ' + chromeVer);
    console.log('  NodeJS Version: ' + nodeVer);
    console.log('  V8 Version: ' + v8Ver);
    console.log('  PDF.js Version: ' + pdfjsVer + '\n');
    app.quit();
  } else if (argsCmd.includes('--file')) {
    electronLog.info('Welcome to ' + appName);
    showSplash = false;
    let tray = new Tray(trayIcon);
    trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setToolTip(appName);
    tray.setContextMenu(trayMenu);
    Menu.setApplicationMenu(menu(store, mainWindow, app));
    // for MacOS
    if (app.dock) {
      app.dock.setIcon(appIcon);
      app.dock.setMenu(trayMenu);
    }

    // For the --file cmdline flag
    let openNewFile;
    let openNewFileUrI;
    if (argsCmd2) {
      openNewFileUrI = argsCmd2;
    }
    // Get the URI specified at the cmdline
    openNewFile = path.resolve(openNewFileUrI);

    createMainWindow();
    mainWindow.loadURL('file://' + openNewFile, options);
    // Load the URI specified at the cmdline
    if (openNewFile !== undefined) {
      if (openNewFile) {
        mainWindow.loadURL('file://' + openNewFile, options);
        electronLog.info('Note: Opening file specified on commandline at ' + [ openNewFileUrI ]);
      }
    }
  } else {
    electronLog.info('Welcome to ' + appName);
    showSplash = true;
    showSplashWindow();
    let tray = new Tray(trayIcon);
    trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setToolTip(appName);
    tray.setContextMenu(trayMenu);
    Menu.setApplicationMenu(menu(store, mainWindow, app));
    // for MacOS
    if (app.dock) {
      app.dock.setIcon(appIcon);
      app.dock.setMenu(trayMenu);
    }
    // hide splash screen randomly after ~0.8 seconds
    setTimeout(createMainWindow, (Math.random() + 2) * 400);
  }
});

// Full restart, quitting Electron. Triggered by developer menu
app.on('restart', () => {
  electronLog.warn('Restarting Electron...');

  // Tell app we are going to relaunch
  app.relaunch();
  // Kill Electron to initiate the relaunch
  app.quit();
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

app.on('activate', () => {
  // On MacOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Called on disallowed remote APIs below
function rejectEvent(event) {
  event.preventDefault();
}

/* Restrict certain Electron APIs in the renderer process for security */
app.on('remote-require', rejectEvent);
