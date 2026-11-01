// src/utils/storage.js
import { Platform } from 'react-native';

// Utiliser localStorage sur web, AsyncStorage sur mobile
let storage;

if (Platform.OS === 'web') {
    storage = {
        getItem: (key) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    };
} else {
    import('@react-native-async-storage/async-storage').then(module => {
        storage = module.default;
    });
}

export default storage;
