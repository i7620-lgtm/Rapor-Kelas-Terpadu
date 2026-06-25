import React from 'react';
import { generateInitialLayout } from '../TransliterationUtil';
import { PAGE_TOP_MARGIN_CM, PAGE_LEFT_RIGHT_MARGIN_CM } from './raporUtils';

interface ReportHeaderProps {
    settings: any;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ settings }) => {
    const currentSemester = settings?.semester || 'Ganjil';
    const layoutField = currentSemester === 'Genap' ? 'kop_layout_Genap' : 'kop_layout';

    let rawLayout = settings[layoutField];
    if (typeof rawLayout === 'string') {
        try {
            rawLayout = JSON.parse(rawLayout);
        } catch (e) {
            rawLayout = null;
        }
    }
    const layout = Array.isArray(rawLayout) && rawLayout.length > 0
        ? rawLayout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', {
            className: "absolute",
            style: {
                top: `${PAGE_TOP_MARGIN_CM}cm`,
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
            }
        },
            React.createElement('div', {
                className: "relative w-full",
                style: { aspectRatio: '800 / 200' }
            },
                React.createElement('svg', {
                    className: "absolute top-0 left-0 w-full h-full",
                    viewBox: "0 0 800 200",
                    preserveAspectRatio: "none"
                },
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
                                    y: el.y + (el.fontSize ?? 14),
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    textAnchor: textAnchor,
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'
                                }, el.content)
                            );
                        }
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || ''); 
                            if (!imageUrl) return null; 
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
