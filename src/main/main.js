import { app, session, BrowserWindow } from 'electron';
const debug = require('debug')('twitch-highlights-app');
const ipc = require('electron').ipcMain;
import ipcService from './ipc';
import platform from './platform';
import releasesProvider from './providers/releases-provider';
import semver from 'semver';
//noinspection JSFileReferences,JSUnresolvedFunction
const pkg = require('./package.json');
//----------------------------------------------------------------------------------------------------------------------

debug('platform:', platform.name);
debug('arch:', platform.arch);
//----------------------------------------------------------------------------------------------------------------------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;
//----------------------------------------------------------------------------------------------------------------------

let App_ready_timeout = 1000;
const App = {
    ready: () => {
        session.defaultSession.webRequest.onHeadersReceived((details, done) => {
            //console.log('onHeadersReceived');
            //console.log(details.url, JSON.stringify(details.responseHeaders, null, '  '));
            delete details.responseHeaders['X-XSS-Protection'];
            delete details.responseHeaders['Content-Security-Policy'];
            
            // TODO we should have a safer way to check this. But it is not working and is prone to breaking in the future...
            /*details.responseHeaders['Content-Security-Policy'] = [
                'script-src \'self\'',
                '\'unsafe-inline\'',
                '*.imrworldwide.com',
                '*.twitch.tv',
                '*.cloudfront.net',
                '*.twitchcdn.net',
                '*.ttvnw.net',
                'devtools: \'unsafe-eval\'',
    
                ';',
                'worker-src \'self\'',
                '\'unsafe-inline\'',
                '*.imrworldwide.com',
                '*.twitch.tv',
                '*.cloudfront.net',
                '*.twitchcdn.net',
                '*.ttvnw.net',
                'devtools: \'unsafe-eval\'',
            ].join(' ');*/
            done({
                cancel: false,
                responseHeaders: details.responseHeaders,
            });
        });
        
        ipcService.start(app);
    
        App.createWindow();
        //mainWindow.toggleDevTools();
        
        //TODO remove this toggleWindow()
        //toggleWindow();
    },
    
    createWindow: () => {
        let webappReady = false;
        ipc.on('webapp_ready', function(/*event, arg*/) {
            webappReady = true;
        });
        
        mainWindow = require('./main-window');
        mainWindow.show();
        mainWindow.setBackgroundColor('#333333');
        
        setTimeout(() => {
            if (!webappReady) {
                console.log('Webapp not ready :-(');
                App.createWindow();
            }
            else {
                console.log('Webapp ready :-D');
                releasesProvider.loadLatestRelease()
                .then((release) => {
                    if (release) {
                        console.log(`Latest release: ${release.tag_name} vs ${pkg.version}`);
                        if (semver.gt(release.tag_name.substring(1), pkg.version)) {
                            release.new_version = true;
                            console.log(`NEW VERSION ${release.tag_name}`);
                            mainWindow.webContents.send('latest_version', release);
                        }
                    }
                    return;
                })
                .catch(e => {
                    console.error(e);
                });
            }
        }, App_ready_timeout);
        
        App_ready_timeout *= 2;
    },
    
    exit: () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        
        //Unregister all shortcuts.
        //globalShortcut.unregisterAll();
        
        app.quit();
        app.exit(0);
    },
};

console.log('getPath', app.getPath('exe'));
console.log('getDataPath', app.getPath('userData'));

//PLATFORM DETECTION
process.on('uncaughtException', function(err) {
    console.error('EXCEPTION OCCURRED');
    console.error(err);
    app.exit();
});

app.commandLine.appendSwitch('disable-http-cache', '');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        App.ready();
    }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.whenReady().then(App.ready).catch(e => {
    console.error('EXCEPTION OCCURRED');
    console.error(e);
    app.exit();
});
