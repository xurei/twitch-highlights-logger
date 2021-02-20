const ipc = require('electron').ipcMain;
const twitchChatProvider = require('./providers/twitch-chat-provider');
const debug = require('debug')('twitch-highlights-ipc');

module.exports = {
    start: function(app) {
        const mainWindow = require('./main-window');
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
    
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
