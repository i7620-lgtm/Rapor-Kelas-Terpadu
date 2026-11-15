export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RKT_ImagesDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
    });
};

export const saveImageToDB = async (key: string, blob: Blob): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.put(blob, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadImageFromDB = async (key: string): Promise<Blob | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as Blob | undefined);
        request.onerror = () => reject(request.error);
    });
};

export const deleteImageFromDB = async (key: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const listAllImageKeys = async (): Promise<string[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAllKeys();
        request.onsuccess = () => resolve((request.result || []).map((k) => String(k)));
        request.onerror = () => reject(request.error);
    });
};

export const processAndCompressImage = (file: Blob, maxWidth: number, maxHeight: number, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = (event.target?.result as string) || '';
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
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to encode image blob'));
                }, 'image/webp', quality);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};

export const processAndCropImage3x4 = (file: Blob, targetWidth = 354, targetHeight = 472, quality = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = (event.target?.result as string) || '';
            img.onload = () => {
                const sourceWidth = img.width;
                const sourceHeight = img.height;
                
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
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                
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

export const STUDENT_PHOTO_PREFIX = 'student_photo_';

export const getStudentPhotoKey = (studentId: string): string =>
    `${STUDENT_PHOTO_PREFIX}${studentId}`;

export const loadAllImagesFromDB = async (): Promise<Record<string, string>> => {
    const images: Record<string, string> = {};
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

export const loadAllStudentPhotosFromDB = async (validStudentIds?: Set<string>): Promise<Record<string, string>> => {
    const photoUrls: Record<string, string> = {};
    try {
        const keys = await listAllImageKeys();
        const studentKeys = keys.filter((k) => k.startsWith(STUDENT_PHOTO_PREFIX));
        await Promise.all(
            studentKeys.map(async (key) => {
                const studentId = key.slice(STUDENT_PHOTO_PREFIX.length);
                if (!studentId || (validStudentIds && !validStudentIds.has(studentId))) return;
                try {
                    const blob = await loadImageFromDB(key);
                    if (blob) {
                        photoUrls[studentId] = URL.createObjectURL(blob);
                    }
                } catch (err) {
                    console.error(`Failed to load student photo ${key} from DB`, err);
                }
            })
        );
    } catch (e) {
        console.error('Failed to list student photos from DB', e);
    }
    return photoUrls;
};

export const cleanupUnusedStudentPhotosInDB = async (validStudentIds: Set<string>): Promise<void> => {
    try {
        const keys = await listAllImageKeys();
        const orphanKeys = keys.filter((key) => {
            if (!key.startsWith(STUDENT_PHOTO_PREFIX)) return false;
            const studentId = key.slice(STUDENT_PHOTO_PREFIX.length);
            return !studentId || !validStudentIds.has(studentId);
        });
        if (orphanKeys.length > 0) {
            await Promise.all(orphanKeys.map((key) => deleteImageFromDB(key)));
        }
    } catch (e) {
        console.error('Failed to cleanup orphaned student photos in DB', e);
    }
};

export const saveStudentPhotoBlob = async (studentId: string, blob: Blob): Promise<string> => {
    const key = getStudentPhotoKey(studentId);
    await saveImageToDB(key, blob);
    return URL.createObjectURL(blob);
};

export const deleteStudentPhotoFromDB = async (studentId: string): Promise<void> => {
    try {
        await deleteImageFromDB(getStudentPhotoKey(studentId));
    } catch (e) {
        console.error(`Failed to delete student photo for ${studentId}`, e);
    }
};

export const convertDataUrlToWebPBlob = async (
    dataUrl: string,
    maxWidth = 354,
    maxHeight = 472,
    quality = 0.9
): Promise<Blob> => {
    let rawBlob: Blob;
    try {
        rawBlob = dataURLToBlob(dataUrl);
    } catch {
        const resp = await fetch(dataUrl);
        rawBlob = await resp.blob();
    }
    try {
        return await processAndCompressImage(rawBlob, maxWidth, maxHeight, quality);
    } catch {
        return rawBlob;
    }
};

export const loadStudentPhotoDataURL = async (studentId: string): Promise<string | null> => {
    try {
        const blob = await loadImageFromDB(getStudentPhotoKey(studentId));
        if (!blob) return null;
        return await blobToDataURL(blob);
    } catch (e) {
        console.error(`Failed to read student photo DataURL for ${studentId}`, e);
        return null;
    }
};

export const getImageDimensions = (key: string) => {
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

export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const dataURLToBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const isBase64 = parts[0].includes('base64');
    if (isBase64) {
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } else {
        const decoded = decodeURIComponent(parts[1]);
        return new Blob([decoded], { type: mime });
    }
};


