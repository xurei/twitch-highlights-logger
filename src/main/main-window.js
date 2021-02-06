import { BrowserWindow } from 'electron';
import path from 'path';
import releasesProvider from './providers/releases-provider';
import semver from 'semver';
//noinspection JSFileReferences,JSUnresolvedFunction
const pkg = require('./package.json');
import platform from './platform';

let DIRSEP = '/';
if (platform.isWin)
{DIRSEP = '\\';}

// Create the browser window.
const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    icon: path.join(__dirname, '300x300.png'),
    webPreferences: {
        nodeIntegration: true,
    },
});
mainWindow.setMenu(null);
mainWindow.setTitle('Twitch highlights');
// and load the index.html of the app
mainWindow.loadURL(`file://${__dirname + DIRSEP}index.html`);
console.log(`file://${__dirname + DIRSEP}index.html`);

mainWindow.on('show', function(e) {
    releasesProvider.loadLatestRelease()
    .then((release) => {
        console.log(`Latest release: ${release.tag_name} vs ${pkg.version}`);
        if (semver.gt(release.tag_name.substring(1), pkg.version)) {
            release.new_version = true;
            console.log(`NEW VERSION ${release.tag_name}`);
        }
        mainWindow.webContents.send('latest_version', release);
        return;
    })
    .catch(e => {
        console.error(e);
    });
});

// Emitted when the window is closed.
/*mainWindow.on('close', function(e) {
    if (mainWindow !== null) {
        e.preventDefault();
        mainWindow.hide();
    }
});*/

module.exports = mainWindow;
