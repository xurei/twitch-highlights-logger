import { BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import releasesProvider from './providers/releases-provider';
import semver from 'semver';
//noinspection JSFileReferences,JSUnresolvedFunction
const pkg = require('./package.json');

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

mainWindow.on('show', function(e) {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }))
    .catch(e => {
        console.error(e);
    });
    releasesProvider.loadLatestRelease()
    .then((release) => {
        if (release) {
            console.log(`Latest release: ${release.tag_name} vs ${pkg.version}`);
            if (semver.gt(release.tag_name.substring(1), pkg.version)) {
                release.new_version = true;
                console.log(`NEW VERSION ${release.tag_name}`);
            }
            mainWindow.webContents.send('latest_version', release);
        }
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
