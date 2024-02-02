const path = require('path');
const data = require(path.join(__dirname, '../package.json'));

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

module.exports = {
  appName: data.productName,
  appVersion: data.version,
  appDescription: data.description,
  copyrightInfo: data.copyright,
  author: data.author,
  website: data.website,
  iconPath: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
  trayIconPath: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon32.png')
}
