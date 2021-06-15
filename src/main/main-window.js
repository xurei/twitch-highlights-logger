import { app, BrowserWindow } from 'electron';
import path from 'path';

// Create the browser window.
const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    sandbox: true,
    show: false,
    icon: path.join(__dirname, '300x300.png'),
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
    },
});
mainWindow.setMenu(null);
mainWindow.setTitle('Twitch Highlights');
mainWindow.loadFile('index.html');

mainWindow.on('unresponsive', () => {
    console.log('Window is unresponsive');
} );

mainWindow.on('close', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

module.exports = mainWindow;
