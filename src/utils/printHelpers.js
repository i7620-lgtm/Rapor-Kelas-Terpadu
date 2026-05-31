import html2canvas from 'html2canvas';

export const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const handleMobilePrint = async (containerRef, paperSizeCss) => {
    if (!containerRef.current) return false;
    
    // Add temporary styling to body & html to ensure correct rendering before snapshot
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    
    try {
        const canvas = await html2canvas(containerRef.current, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Hide normal app content
        const rootElements = document.querySelectorAll('body > div');
        rootElements.forEach(el => el.style.display = 'none');
        
        // Create full screen image container for printing
        const printContainer = document.createElement('div');
        printContainer.id = 'mobile-print-container';
        printContainer.style.width = '100%';
        printContainer.style.position = 'absolute';
        printContainer.style.top = '0';
        printContainer.style.left = '0';
        printContainer.style.zIndex = '999999';
        printContainer.style.background = 'white';
        
        const img = document.createElement('img');
        img.src = imgData;
        img.style.width = '100%'; 
        img.style.display = 'block';
        img.style.margin = '0';
        img.style.padding = '0';
        
        printContainer.appendChild(img);
        document.body.appendChild(printContainer);

        const style = document.createElement('style');
        style.id = 'mobile-print-style';
        style.innerHTML = `
            @page { ${paperSizeCss} margin: 0 !important; }
            body { margin: 0; background: white; }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `;
        document.head.appendChild(style);

        // Wait for image to render in DOM
        await new Promise(resolve => setTimeout(resolve, 300));
        
        window.print();
        
        // Cleanup after print
        // Many mobile browsers don't fire afterprint reliably, or block print asynchronously.
        // But we have to cleanup at some point. Let's use afterprint, with a small timeout fallback.
        const cleanup = () => {
            document.body.removeChild(printContainer);
            const styleElem = document.getElementById('mobile-print-style');
            if (styleElem) document.head.removeChild(styleElem);
            rootElements.forEach(el => el.style.display = '');
            window.removeEventListener('afterprint', cleanup);
        };
        
        // Mobile Safari might freeze if cleanup runs too soon. Give it some time or wait for afterprint.
        window.addEventListener('afterprint', cleanup);
        // Fallback cleanup if afterprint doesn't fire after a while (though print dialogs might stay open for a while, so this is tricky).
        // It's usually safer to rely on afterprint or just let the user see the image after print.
        setTimeout(() => {
            if (document.getElementById('mobile-print-container')) {
                cleanup();
            }
        }, 10000); // 10s fallback

        return true;
    } catch (e) {
        console.error("Error generating print image on mobile", e);
        // Ensure root is unhidden if we fail
        document.querySelectorAll('body > div').forEach(el => el.style.display = '');
        return false;
    } finally {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
    }
};
