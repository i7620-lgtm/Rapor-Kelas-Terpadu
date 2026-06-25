export async function getFontEmbedCSS() {
    const urls = [
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Balinese&display=swap',
        'https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pinyon+Script&family=Alex+Brush&family=Dancing+Script:wght@400;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    ];
    let cssText = '';
    for (const url of urls) {
        try {
            const res = await fetch(url);
            let text = await res.text();
            const urlRegex = /url\(([^)]+)\)/g;
            let match;
            const fontMatches = [];
            while ((match = urlRegex.exec(text)) !== null) {
                fontMatches.push(match[1].replace(/['"]/g, ''));
            }
            const uniqueFontUrls = [...new Set(fontMatches)];
            
            for (const fontUrl of uniqueFontUrls) {
                try {
                    const fontRes = await fetch(fontUrl);
                    const fontBlob = await fontRes.blob();
                    const base64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(fontBlob);
                    });
                    text = text.split(fontUrl).join(base64 as string);
                } catch (err) {
                    console.error('Failed to fetch font', fontUrl, err);
                }
            }
            cssText += text + '\n';
        } catch (e) {
            console.error('Failed to fetch font css', url, e);
        }
    }
    return cssText;
}
