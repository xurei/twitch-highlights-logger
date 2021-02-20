const ipc = require('electron').ipcMain;
const shell = require('electron').shell;
const twitchChatProvider = require('./providers/twitch-chat-provider');
const debug = require('debug')('twitch-highlights-ipc');

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
            });
        });
    
        ipc.on('github_page', function(/*event, arg*/) {
            shell.openExternal('https://github.com/xurei/twitch-highlights-logger');
        });
    
        ipc.on('close', function(/*event, arg*/) {
            mainWindow.hide();
        });
        
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
