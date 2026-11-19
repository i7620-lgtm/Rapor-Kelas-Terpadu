import React from 'react';
import { resolveKopLayout } from '../../utils/TransliterationUtil';
import { PAGE_TOP_MARGIN_CM, PAGE_LEFT_RIGHT_MARGIN_CM } from './raporUtils';

interface ReportHeaderProps {
    settings: any;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ settings }) => {
    const layout = resolveKopLayout(settings);

    return (
        <div
            className="absolute"
            style={{
                top: `${PAGE_TOP_MARGIN_CM}cm`,
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM}cm`,
            }}
        >
            <div className="relative w-full" style={{ aspectRatio: '800 / 200' }}>
                <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                    {layout.map((el: any) => {
                        if (el.type === 'text') {
                            let textAnchor: 'start' | 'middle' | 'end' = 'start';
                            let xPos = el.x;
                            if (el.textAlign === 'center') {
                                textAnchor = 'middle';
                                xPos = el.x + (el.width ?? 0) / 2;
                            } else if (el.textAlign === 'right') {
                                textAnchor = 'end';
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
                        if (el.type === 'image') {
                            const imageUrl = String(settings[el.content] || '');
                            if (!imageUrl) return null;
                            return <image key={el.id} href={imageUrl} x={el.x} y={el.y} width={el.width} height={el.height} />;
                        }
                        if (el.type === 'line') {
                            return <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} fill="black" />;
                        }
                        return null;
                    })}
                </svg>
            </div>
        </div>
    );
};
