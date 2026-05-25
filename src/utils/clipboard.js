export const getClipboardText = async (e) => {
    // Try standard synchronous clipboard
    let text = "";
    if (e.clipboardData) {
        text = e.clipboardData.getData("text/plain") || e.clipboardData.getData("text");
    }

    // Try HTML if plain text is empty
    if (!text && e.clipboardData) {
        const html = e.clipboardData.getData("text/html");
        if (html) {
            text = parseHtmlTableToText(html);
        }
    }

    // Attempt to fallback to Async Clipboard API as a last resort
    if (!text && navigator.clipboard && navigator.clipboard.readText) {
        try {
            text = await navigator.clipboard.readText();
        } catch (err) {
            console.error("Async clipboard read failed:", err);
        }
    }

    return text || "";
};

const parseHtmlTableToText = (html) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // If it's a table (like from Excel)
        const rows = Array.from(doc.querySelectorAll("tr"));
        if (rows.length > 0) {
            return rows.map(tr => {
                const cells = Array.from(tr.querySelectorAll("td, th"));
                return cells.map(td => td.textContent.replace(/[\n\r]/g, " ").trim()).join("\t");
            }).join("\n");
        }
        
        // Fallback to just extracting all text if no table structure is found
        return doc.body.textContent.trim();
    } catch (e) {
        console.error("Error parsing HTML clipboard data:", e);
        return "";
    }
};
