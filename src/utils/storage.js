import localforage from 'localforage';

export const deepMerge = (target, source) => {
    if (typeof target !== 'object' || target === null) return source !== undefined ? source : target;
    if (typeof source !== 'object' || source === null) return source !== undefined ? source : target;
    if (Array.isArray(target) && Array.isArray(source)) return source; 
    
    let merged = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key] instanceof Object && !Array.isArray(target[key])) {
            merged[key] = deepMerge(target[key], source[key]);
        } else {
            if (source[key] !== undefined) {
                merged[key] = source[key];
            }
        }
    }
    return merged;
};

export const loadDataSafeAsync = async (key, fallbackValue, validator = null, legacyKey = null) => {
    try {
        let val = await localforage.getItem(key);
        if (val === null && legacyKey) {
            val = await localforage.getItem(legacyKey);
        }
        if (val === null) {
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    val = parsed;
                    await localforage.setItem(key, parsed);
                } catch(e) {}
            } else if (legacyKey) {
                const legacySaved = localStorage.getItem(legacyKey);
                if (legacySaved) {
                    try {
                        const parsed = JSON.parse(legacySaved);
                        val = parsed;
                        await localforage.setItem(key, parsed);
                    } catch(e) {}
                }
            }
        }
        if (val === null) return fallbackValue;

        if (validator && !validator(val)) {
            console.warn(`Data validation failed for key: ${key}. Reverting to fallback.`);
            return fallbackValue;
        }
        if (Array.isArray(fallbackValue) && !Array.isArray(val)) {
            return fallbackValue;
        }
        if (typeof fallbackValue === 'object' && !Array.isArray(fallbackValue) && fallbackValue !== null) {
             return deepMerge(fallbackValue, val);
        }
        return val;
    } catch (e) {
        console.error(`Error loading ${key}:`, e);
        return fallbackValue;
    }
};
