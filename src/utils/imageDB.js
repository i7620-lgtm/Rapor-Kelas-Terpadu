export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RKT_ImagesDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
    });
};

export const saveImageToDB = async (key, blob) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.put(blob, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadImageFromDB = async (key) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteImageFromDB = async (key) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const processAndCompressImage = (file, maxWidth, maxHeight, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/webp', quality);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};

export const processAndCropImage3x4 = (file, targetWidth = 354, targetHeight = 472, quality = 0.9) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let sourceWidth = img.width;
                let sourceHeight = img.height;
                
                const targetRatio = targetWidth / targetHeight;
                const sourceRatio = sourceWidth / sourceHeight;
                
                let cropWidth = sourceWidth;
                let cropHeight = sourceHeight;
                let offsetX = 0;
                let offsetY = 0;
                
                if (sourceRatio > targetRatio) {
                    cropWidth = sourceHeight * targetRatio;
                    offsetX = (sourceWidth - cropWidth) / 2;
                } else {
                    cropHeight = sourceWidth / targetRatio;
                    offsetY = (sourceHeight - cropHeight) / 2;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
                
                const dataUrl = canvas.toDataURL('image/webp', quality);
                resolve(dataUrl);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};

export const IMAGE_KEYS = [
    'logo_sekolah', 'logo_dinas', 'logo_cover', 
    'piagam_background', 'ttd_kepala_sekolah', 'ttd_wali_kelas'
];

export const loadAllImagesFromDB = async () => {
    const images = {};
    for (const key of IMAGE_KEYS) {
        try {
            const blob = await loadImageFromDB(key);
            if (blob) {
                images[key] = URL.createObjectURL(blob);
            }
        } catch (e) {
            console.error(`Failed to load image ${key} from DB`, e);
        }
    }
    return images;
};

export const getImageDimensions = (key) => {
    switch (key) {
        case 'logo_sekolah':
        case 'logo_dinas':
        case 'logo_cover':
            return { width: 300, height: 300 };
        case 'piagam_background':
            return { width: 1200, height: 1600 };
        case 'ttd_kepala_sekolah':
        case 'ttd_wali_kelas':
            return { width: 400, height: 200 };
        default:
            return { width: 800, height: 800 };
    }
};
