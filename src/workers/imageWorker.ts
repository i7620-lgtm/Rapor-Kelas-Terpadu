// Image processing Web Worker for off-thread photo cropping and compression
self.onmessage = async (e: MessageEvent) => {
  const { id, file, targetWidth = 354, targetHeight = 472, quality = 0.9 } = e.data;

  try {
    const bitmap = await createImageBitmap(file);
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;

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

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('OffscreenCanvas 2D context unavailable');
      }

      ctx.drawImage(bitmap, offsetX, offsetY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality });

      // Convert blob to DataURL in worker
      const reader = new FileReader();
      reader.onloadend = () => {
        bitmap.close();
        self.postMessage({ id, success: true, dataUrl: reader.result });
      };
      reader.onerror = () => {
        bitmap.close();
        self.postMessage({ id, success: false, error: 'FileReader failed in worker' });
      };
      reader.readAsDataURL(blob);
    } else {
      bitmap.close();
      throw new Error('OffscreenCanvas not supported in this environment');
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || 'Image processing failed' });
  }
};
