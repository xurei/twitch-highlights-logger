const ipc = require('electron').ipcMain;
const { globalShortcut, shell } = require('electron');
const path = require('path');
const twitchChatProvider = require('./providers/twitch-chat-provider');
const debug = require('debug')('hyperkeys-ipc');

module.exports = {
    start: function(app) {
        const mainWindow = require('./main-window');
        
        ipc.on('set_config', function(event, newConfig) {
            debug('newConfig', newConfig);
        });
    
        ipc.on('load_chatlog', function(event, arg) {
            console.log(arg);
            twitchChatProvider.loadChatlog(arg).then(data => {
                console.log('Sending logs to main view');
                mainWindow.webContents.send('chatlog', data);
                return;
            })
            .catch(e => {
                console.error(e);
            })
        });
    
        ipc.on('close', function(/*event, arg*/) {
            mainWindow.hide();
        });
        
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
