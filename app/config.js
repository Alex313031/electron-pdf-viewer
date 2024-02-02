const { app } = require('electron');
const path = require('path');
const data = require(path.join(__dirname, '/package.json'));
const isWin = process.platform === 'win32';

module.exports = {
  appName: app.getName(),
  appVersion: app.getVersion(),
  appDescription: data.description,
  copyrightInfo: data.copyright,
  author: data.author,
  website: data.website,
  iconPath: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
  trayIconPath: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon32.png')
}
