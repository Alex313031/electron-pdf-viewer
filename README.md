![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/Alex313031/electron-pdf-viewer?label=Version%3A) &nbsp;![GitHub](https://img.shields.io/github/license/Alex313031/electron-pdf-viewer?color=green&label=License%3A) &nbsp;![GitHub commit activity](https://img.shields.io/github/commit-activity/w/Alex313031/electron-pdf-viewer?color=blueviolet&label=Commit%20Activity%3A) 

<img src="https://github.com/Alex313031/electron-pdf-viewer/blob/master/Logo.png" width="48">&nbsp;&nbsp;Electron PDF Viewer
==========  

PDF Viewer app created using [Electron](https://www.electronjs.org/) and [PDF.js](https://mozilla.github.io/pdf.js/).  
<!-- Checkout a more versatile file viewer - https://github.com/praharshjain/Vudit-Desktop -->

Installation
----------------

Download installers from the [Releases](https://github.com/Alex313031/electron-pdf-viewer/releases) section.

Building
----------------

 - Requires NodeJS 14.x, 16.x, or 18.x. I recommend using <a href="https://github.com/nvm-sh/nvm">NVM</a>.  

Install dependencies :
```
sudo apt update &&
sudo apt install build-essential python3-software-properties
nvm i
```

To build & run :
```
git clone https://github.com/Alex313031/electron-pdf-viewer.git
cd electron-pdf-viewer
npm install && npm start
```

To generate installation packages :
```
npm run build && npm run dist
```

Screenshot
----------------  
<img src="https://github.com/Alex313031/electron-pdf-viewer/blob/master/screenshot.png" width="900">
  
License
----------------
[LICENSE.md](https://github.com/Alex313031/electron-pdf-viewer/blob/master/LICENSE.md)  
[PDF.js](https://github.com/mozilla/pdf.js) is available under the Apache License.  
[Electron](https://github.com/electron/electron) is released under the MIT License.
