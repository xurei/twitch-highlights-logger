const { ipcRenderer } = require('electron');
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
    on: (type, callback) => {
        ipcRenderer.on(type, callback);
    },
});

process.once('loaded', () => {
    console.log('preload loaded');
    global.addEventListener('message', event => {
        // do something with custom event
        const message = event.data;
        if (message) {
            if (message.action) {
                ipcRenderer.send(message.action, message.data);
            }
        }
    });
});
