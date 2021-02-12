import localStorage from 'store/dist/store.legacy';

export const LocalStorage = {
    get(key, def) {
        const out = localStorage.get(key);
        if (typeof(out) === 'undefined') {
            return def;
        }
        else {
            return out;
        }
    },
    set(key, val) {
        localStorage.set(key, val);
    },
};
