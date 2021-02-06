import { app, session } from 'electron';
const debug = require('debug')('twitch-highlights-app');
import ipcService from './ipc';
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
        
        ipcService.start(app);
        //mainWindow.toggleDevTools();
        
        function toggleWindow() {
            mainWindow.show();
        }
    
        mainWindow = require('./main-window');
        Promise.resolve()
        //.then(() => checkTrayCompatibility())
        .then(() => {
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
