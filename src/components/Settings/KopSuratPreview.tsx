import React from 'react';
import { generateInitialLayout } from '../TransliterationUtil';

interface KopSuratPreviewProps {
    settings: any;
}

const placeholderSvg = "data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e2e8f0%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ELogo%3C/text%3E%3C/svg%3E";

export const KopSuratPreview: React.FC<KopSuratPreviewProps> = ({ settings }) => {
    let rawLayout = settings.kop_layout;
    if (typeof rawLayout === 'string') {
        try {
            rawLayout = JSON.parse(rawLayout);
        } catch (_e) {
            rawLayout = null;
        }
    }
    const layout = Array.isArray(rawLayout) && rawLayout.length > 0
        ? rawLayout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "bg-slate-50 p-4 rounded-lg border text-left" },
            React.createElement('div', { className: "bg-white shadow-inner relative w-full max-w-[800px] mx-auto overflow-hidden", style: { aspectRatio: '800 / 200' } },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 200", preserveAspectRatio: "xMidYMin meet", className: "absolute top-0 left-0" },
                    layout.map((el: any) => {
                        if (el.type === 'text') {
                            let textAnchor = "start";
                            let xPos = el.x;
                            if (el.textAlign === 'center') {
                                textAnchor = "middle";
                                xPos = el.x + (el.width ?? 0) / 2;
                            } else if (el.textAlign === 'right') {
                                textAnchor = "end";
                                xPos = el.x + (el.width ?? 0);
                            }
                            return (
                                React.createElement('text', {
                                    key: el.id,
                                    x: xPos,
                                    y: el.y,
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    textAnchor: textAnchor,
                                    fill: "black",
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'
                                }, el.content)
                            );
                        }
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || placeholderSvg);
                            return (
                                React.createElement('image', {
                                    key: el.id,
                                    href: imageUrl,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height
                                })
                            );
                        }
                        if (el.type === 'line') {
                            return (
                                React.createElement('rect', {
                                    key: el.id,
                                    x: el.x,
                                    y: el.y,
                                    width: el.width,
                                    height: el.height,
                                    fill: "black"
                                })
                            );
                        }
                        return null;
                    })
                )
            )
        )
    );
};
