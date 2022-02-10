const ipc = require('electron').ipcMain;
const shell = require('electron').shell;
const twitchChatProvider = require('./providers/twitch-chat-provider');
const debug = require('debug')('twitch-highlights-ipc');

module.exports = {
    start: function(app) {
        const mainWindow = require('./main-window');
        ipc.on('load_chatlog', function(event, arg) {
            console.log(arg);
            twitchChatProvider.loadChatlog(arg).then(chatlog => {
                chatlog.onFetchProgress((progress) => {
                    console.log(`Progress: ${progress}%`);
                    mainWindow.webContents.send('chatlogProgress', progress);
                });
                chatlog.onFetchComplete(() => {
                    mainWindow.webContents.send('chatlog', chatlog.payload.comments);
                });
                console.log('Sending logs to main view');
                return;
            })
            .catch(e => {
                console.error(e);
            });
        });
    
        ipc.on('github_page', function(/*event, arg*/) {
            shell.openExternal('https://github.com/xurei/twitch-highlights-logger');
        });
        
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
