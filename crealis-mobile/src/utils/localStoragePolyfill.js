// src/utils/localStoragePolyfill.js
import { Platform } from 'react-native';

// Polyfill localStorage pour mobile
if (Platform.OS !== 'web') {
    global.localStorage = {
        _data: {},
        getItem: function (key) {
            return this._data[key] || null;
        },
        setItem: function (key, value) {
            this._data[key] = String(value);
        },
        removeItem: function (key) {
            delete this._data[key];
        },
        clear: function () {
            this._data = {};
        }
    };
}
