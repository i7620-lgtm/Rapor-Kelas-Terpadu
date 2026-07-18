import React from 'react';
import { generateInitialLayout } from '../../utils/TransliterationUtil';

const PAGE_TOP_MARGIN_CM = 1.5;
const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5;

export const LegerReportHeader = ({ settings }) => {
    const currentSemester = settings?.semester || 'Ganjil';
    const layoutField = currentSemester === 'Genap' ? 'kop_layout_Genap' : 'kop_layout';

    let rawLayout = settings[layoutField];
    if (typeof rawLayout === 'string') {
        try {
            rawLayout = JSON.parse(rawLayout);
        } catch {
            rawLayout = null;
        }
    }
    const layout = Array.isArray(rawLayout) && rawLayout.length > 0
        ? rawLayout
        : generateInitialLayout(settings);

    return (
        <div
            className="absolute"
            style={{
                top: `${PAGE_TOP_MARGIN_CM}cm`,
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
            }}
        >
            <div
                className="relative w-full"
                style={{ aspectRatio: '800 / 200' }}
            >
                <svg
                    className="absolute top-0 left-0 w-full h-full"
                    viewBox="0 0 800 200"
                    preserveAspectRatio="none"
                >
                    {layout.map((el) => {
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
                                <text
                                    key={el.id}
                                    x={xPos}
                                    y={el.y + (el.fontSize ?? 14)}
                                    fontSize={el.fontSize}
                                    fontWeight={el.fontWeight}
                                    textAnchor={textAnchor}
                                    fontFamily={el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'system-ui'}
                                >
                                    {el.content}
                                </text>
                            );
                        }
                        if (el.type === 'line') {
                            return (
                                <rect
                                    key={el.id}
                                    x={el.x}
                                    y={el.y}
                                    width={el.width}
                                    height={el.height}
                                    fill="black"
                                />
                            );
                        }
                        return null;
                    })}
                </svg>
                {layout.map((el) => {
                    if (el.type === 'image') {
                        const imageUrl = String(settings[el.content] || ''); 
                        if (!imageUrl) return null;
                        return (
                            <img
                                key={el.id}
                                src={imageUrl}
                                style={{
                                    position: 'absolute',
                                    left: `${(el.x / 800) * 100}%`,
                                    top: `${(el.y / 200) * 100}%`,
                                    width: `${(el.width / 800) * 100}%`,
                                    height: `${(el.height / 200) * 100}%`,
                                    objectFit: 'fill'
                                }}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};
