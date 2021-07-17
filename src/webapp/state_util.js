export function setSubState(...args) {
    if (args.length < 2) {
        throw new Error('setSubState() : Not enough arguments');
    }
    else if (args.length === 2) {
        return setSubState_one(args[0], args[1]);
    }
    else {
        return setSubState_one(args[0], setSubState(...args.slice(1)));
    }
}

function setSubState_one(subStateName, substateFn) {
    return state => {
        let out = null;
        if (Array.isArray(state)) {
            out = [ ...state ];
        }
        else if (typeof(state) === 'object') {
            out = { ...state };
        }
        else {
            console.error('State is not an object nor an Array, you don\'t need to use setSubState');
        }
        
        /*if (Array.isArray(subStateCopy)) {
            subStateCopy = [ ...subStateCopy ];
        }
        else if (typeof(subStateCopy) === 'object') {
            subStateCopy = { ...subStateCopy };
        }
        else {
            console.error('Substate is not an object nor an Array, you don\'t need to use setSubState');
        }*/
    
        let subStateCopy = state[subStateName];
        out[subStateName] = substateFn(subStateCopy);;
        return out;
    };
}
