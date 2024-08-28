const { Menu, shell, BrowserWindow, app } = require('electron');
const config = require('./config');
const path = require('path');
const electronLog = require('electron-log');
const options = { extraHeaders: 'pragma: no-cache\n' };
// Export app info
const appName = app.getName();
const userHome = app.getPath('home');
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');
const userMacLogFile = path.join(userHome, 'Library/Logs', appName, 'main.log');

module.exports = (store, mainWindow, app) => {

  // Globally export what OS we are on
  const isLinux = process.platform === 'linux';
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  return Menu.buildFromTemplate([
    {
      label: config.appName,
      role: 'fileMenu',
      submenu: [
        {
          label: 'Main Menu',
          accelerator: 'CmdorCtrl+Alt+M',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.loadURL('file://' + __dirname + '/index.html', options);
            electronLog.info('Opening Main Menu');
          }
        },
        {
          label: 'Go Back',
          accelerator: 'Alt+Left',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goBack();
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Navigated backward to ' + [ currentURL ]);
          }
        },
        {
          label: 'Go Forward',
          accelerator: 'Alt+Right',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goForward();
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Navigated forward to ' + [ currentURL ]);
          }
        },
        { type: 'separator' },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click(item, focusedWindow) {
            if (focusedWindow) {
              app.emit('handle-open-file');
            }
          }
        },
        {
          label: 'Open Containing Folder',
          accelerator: 'CmdOrCtrl+F',
          click(item, focusedWindow) {
            if (focusedWindow) {
              app.emit('handle-open-file-path');
            }
          }
        },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.print();
            electronLog.info('Opened Print dialog');
          }
        },
        {
          label: 'Close File',
          accelerator: 'Shift+CmdOrCtrl+Z',
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.loadURL('file://' + __dirname + '/index.html', options);
              electronLog.info('Closed file: ');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit ' + appName,
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      role: 'editMenu',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      role: 'viewMenu',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Toggling Developer Tools on ' + currentURL);
            focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      role: 'windowMenu',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdorCtrl+N',
          click() {
            app.emit('new-window');
          }
        },
        {
          label: 'Minimize Window',
          accelerator: 'CmdOrCtrl+M',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.minimize();
            electronLog.info('Minimized a window');
          }
        },
        {
          label: 'Close Window',
          accelerator: 'CmdorCtrl+W',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.close();
            electronLog.info('Closed a Window');
          }
        }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Reload F5',
          accelerator: 'F5',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Open Log File',
          click() {
            if (isMac) {
              electronLog.info('Opening ' + [ userMacLogFile ]);
              const logWindow = new BrowserWindow({ width: 600, height: 768, useContentSize: true, title: userMacLogFile });
              logWindow.loadFile(userMacLogFile);
            } else {
              electronLog.info('Opening ' + [ userLogFile ]);
              const logWindow = new BrowserWindow({ width: 600, height: 768, useContentSize: true, title: userLogFile });
              logWindow.loadFile(userLogFile);
            }
          }
        },
        {
          label: 'Edit Config File',
          click() {
            electronLog.info('Editing Config File');
            if (isLinux) {
              electronLog.info('\n Note that JSON must be a recognized file type \n for the OS to open the config.json file.\n');
              electronLog.info('\n On Linux, a default text editor for handling JSON files must also be present and configured correctly.\n');
              store.openInEditor();
              return;
            } else {
              electronLog.info('\n Note that JSON must be a recognized file type \n for the OS to open the config.json file.\n');
              store.openInEditor();
            }
          }
        },
        {
          label: 'Open User Data Dir',
          click() {
            electronLog.info('Opening ' + [ userDataDir ]);
            shell.openPath(userDataDir);
          }
        },
        { type: 'separator' },
        {
          label: 'Open Electron DevTools',
          accelerator: isMac ? 'Cmd+Shift+F12' : 'F12',
          click(item, focusedWindow) {
            electronLog.info('Opening Electron DevTools on mainWindow.');
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open Electron DevTools Extra',
          accelerator: 'Ctrl+Shift+F12',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            electronLog.info('Opening Electron DevTools on mainWindow.');
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open chrome://gpu',
          accelerator: 'CmdorCtrl+Alt+G',
          click() {
            const gpuWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'GPU Internals' });
            gpuWindow.loadURL('chrome://gpu');
            electronLog.info('Opened chrome://gpu');
          }
        },
        {
          label: 'Open chrome://process-internals',
          accelerator: 'CmdorCtrl+Alt+Shift+P',
          click() {
            const procsWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Process Model Internals' });
            procsWindow.loadURL('chrome://process-internals');
            electronLog.info('Opened chrome://process-internals');
          }
        },
        {
          label: 'Open chrome://media-internals',
          accelerator: 'CmdorCtrl+Alt+Shift+M',
          click() {
            const mediaWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Media Internals' });
            mediaWindow.loadURL('chrome://media-internals');
            electronLog.info('Opened chrome://media-internals');
          }
        },
        {
          label: 'Restart App',
          accelerator: 'CmdorCtrl+Alt+Shift+R',
          click() {
            app.emit('restart');
          }
        }
      ]
    },
    {
      label: 'About',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            new BrowserWindow({ width: 1024, height: 768, useContentSize: true }).loadURL('https://github.com/Alex313031/electron-pdf-viewer#readme');
          }
        },
        {
          label: 'View Humans.txt',
          accelerator: 'CmdorCtrl+Alt+H',
          click() {
            const humansWindow = new BrowserWindow({
              width: 532,
              height: 532,
              useContentSize: true,
              autoHideMenuBar: true,
              title: 'humans.txt'
            });
            humansWindow.loadFile(path.join(__dirname, 'humans.txt'));
            electronLog.info('Opened humans.txt :)');
          }
        },
        {
          label: 'View License',
          accelerator: 'CmdorCtrl+Alt+L',
          click() {
            const licenseWindow = new BrowserWindow({
              width: 532,
              height: 548,
              useContentSize: true,
              autoHideMenuBar: true,
              title: 'License'
            });
            licenseWindow.loadFile(path.join(__dirname, 'license.md'));
            electronLog.info('Opened license.md');
          }
        },
        {
          label: 'About App',
          accelerator: 'CmdorCtrl+Alt+A',
          click() {
            const aboutWindow = new BrowserWindow({
              width: 500,
              height: 432,
              useContentSize: true,
              autoHideMenuBar: true,
              skipTaskbar: true,
              darkTheme: true,
              title: 'About ' + appName,
              icon: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
              webPreferences: {
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
                contextIsolation: false,
                sandbox: false,
                experimentalFeatures: true,
                webviewTag: true,
                devTools: true,
                preload: path.join(__dirname, 'preload.js')
              }
            });
            require('@electron/remote/main').enable(aboutWindow.webContents);
            aboutWindow.loadURL('file://' + __dirname + '/about.html', options);
            electronLog.info('Opened about.html');
          }
        },
        //{
        //  label: 'About',
        //  click: function () {
        //    dialog.showMessageBox(mainWindow, {
        //      type: 'info',
        //      buttons: ['OK'],
        //      title: config.appName,
        //      message: 'Version ' + config.appVersion,
        //      detail: 'Created By - ' + config.author,
        //      icon: appIcon
        //    });
        //  }
        //}
      ]
    }
  ]);
};
