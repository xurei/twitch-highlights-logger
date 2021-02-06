import { app, session } from 'electron';
const debug = require('debug')('hyperkeys-app');
import ipcService from './ipc';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import platform from './platform';
//----------------------------------------------------------------------------------------------------------------------

debug('platform:', platform.name);
debug('arch:', platform.arch);
const APPPATH = __dirname;
debug('APPPATH:', APPPATH);
//----------------------------------------------------------------------------------------------------------------------

let DIRSEP = '/';
if (platform.isWin)
{DIRSEP = '\\';}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;
//----------------------------------------------------------------------------------------------------------------------

const App = {
    ready: () => {
        mainWindow = require('./main-window');
        
        session.defaultSession.webRequest.onHeadersReceived((details, done) => {
            //console.log('onHeadersReceived');
            //console.log(details.url, JSON.stringify(details.responseHeaders, null, '  '));
            delete details.responseHeaders['X-XSS-Protection'];
            delete details.responseHeaders['Content-Security-Policy'];
            done({
                cancel: false,
                responseHeaders: details.responseHeaders,
            });
        });
        
        if (process.env['NODE_ENV'] === 'development') {
            installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
        }
        
        ipcService.start(app);
        //mainWindow.toggleDevTools();
        
        function toggleWindow() {
            mainWindow.show();
        }
        
        Promise.resolve()
        //.then(() => checkTrayCompatibility())
        .then(() => {
            if (platform.isWin || platform.isLinux) {
                console.log(`${APPPATH + DIRSEP}300x300.png`);
            }
            mainWindow.show();
            return;
        })
        .catch(e => {
            console.error(e);
        });
        
        //TODO remove this toggleWindow()
        //toggleWindow();
    },
    
    exit: () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        
        //Unregister all shortcuts.
        //globalShortcut.unregisterAll();
        
        //Destroy the app icon
        if (appIcon !== null) {
            appIcon.destroy();
        }
        
        app.quit();
        app.exit(0);
    },
};

console.log('getPath', app.getPath('exe'));
console.log('getDataPath', app.getPath('userData'));

//PLATFORM DETECTION
process.on('uncaughtException', function(err) {
    console.log('EXCEPTION OCCURRED');
    console.log(err);
    app.exit();
});

app.commandLine.appendSwitch('disable-http-cache', '');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin')
    {app.quit();}
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', App.ready);
