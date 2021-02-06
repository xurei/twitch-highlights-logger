const ipc = require('electron').ipcMain;
const { globalShortcut, shell } = require('electron');
const uuid = require('uuid').v4;
const path = require('path');
const debug = require('debug')('hyperkeys-ipc');

function registerShortcuts(macros) {
    debug(macros);
    for (const macro of macros) {
        if (macro.enabled) {
            for (const action of Object.keys(macro.shortcuts)) {
                const shortcut = macro.shortcuts[action];
                if (shortcut !== null) {
                    keybindsService.registerKey({key: shortcut, action: {id_macro: macro.id, name: action, config: macro.config}});
                }
            }
        }
    }
}
//----------------------------------------------------------------------------------------------------------------------

function updateShortcuts(macros) {
    //TODO diff previous and next macros and only update that
    globalShortcut.unregisterAll();
    registerShortcuts(macros);
}
//----------------------------------------------------------------------------------------------------------------------

function normalizeMacro(macro, metadata) {
    function callMeta(meta, config) {
        if (typeof meta === 'function') {
            return meta(config);
        }
        else {
            return meta;
        }
    }
    
    const out = JSON.parse(JSON.stringify(macro));
    out.title = callMeta(metadata.title, macro.config);
    
    return out;
}
//----------------------------------------------------------------------------------------------------------------------

function normalizeMetadata(metadata) {
    function callMeta(meta) {
        if (typeof meta === 'function') {
            return meta(null);
        }
        else {
            return meta;
        }
    }
    
    const out = JSON.parse(JSON.stringify(metadata));
    out.title = callMeta(metadata.title);
    
    return out;
}
//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    start: function(app) {
        const mainWindow = require('./main-window');
        
        ipc.on('set_config', function(event, newConfig) {
            debug('newConfig', newConfig);
            
            macros.forEach((macro, index) => {
                if (macro.id === newConfig.id) {
                    debug('found matching macro');
                    macros[index].config = newConfig.config;
                }
            });
            
            updateShortcuts(macros);
            macrosProvider.saveMacros(macros);
            sendMacros();
        });
        
        ipc.on('close', function(/*event, arg*/) {
            mainWindow.hide();
        });
        
        ipc.on('devtools', function(/*event, arg*/) {
            mainWindow.toggleDevTools();
        });
    },
};
