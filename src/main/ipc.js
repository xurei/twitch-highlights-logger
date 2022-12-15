const ipc = require('electron').ipcMain;
const shell = require('electron').shell;
const twitchChatProvider = require('./providers/twitch-chat-provider');
//const debug = require('debug')('twitch-highlights-ipc');

module.exports = {
    start: function() {
        const mainWindow = require('./main-window');
        ipc.on('load_chatlog', function(event, arg) {
            twitchChatProvider.loadChatlog(arg).then(chatlog => {
                chatlog.onFetchProgress((progress) => {
                    console.log(`Progress: ${progress}%`);
                    mainWindow.webContents.send('chatlogProgress', progress);
                });
                chatlog.onFetchComplete(() => {
                    mainWindow.webContents.send('chatlog', chatlog.payload.comments);
                });
                chatlog.onFetchError(() => {
                    mainWindow.webContents.send('chatlogError');
                    console.error('ERROR LOADING CHATLOG');
                    mainWindow.webContents.send('chatlogError', null);
                });
                console.log('Sending logs to main view');
                return;
            })
            .catch(e => {
                console.error(e);
                this._fetchErrorCallbacks.forEach(callback => {
                    callback();
                });
            });
        });
    
        ipc.on('open_page', function(event, arg) {
            shell.openExternal(arg);
        });
        
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
