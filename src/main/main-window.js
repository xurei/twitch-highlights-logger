import { BrowserWindow } from 'electron';
import path from 'path';
import releasesProvider from './providers/releases-provider';
import semver from 'semver';
//noinspection JSFileReferences,JSUnresolvedFunction
const pkg = require('./package.json');

// Create the browser window.
const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    sandbox: true,
    show: false,
    icon: path.join(__dirname, '300x300.png'),
    webPreferences: {
        nodeIntegration: true,
    },
});
mainWindow.setMenu(null);
mainWindow.setTitle('Twitch highlights');

mainWindow.loadURL(new URL(`file://${path.join(__dirname, 'index.html')}`).toString())
.catch(e => {
    console.error(e);
});

mainWindow.on('show', function(e) {
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

module.exports = mainWindow;
