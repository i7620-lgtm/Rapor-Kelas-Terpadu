import React, { useMemo } from 'react';
import { DefaultPiagamBackground } from './DefaultPiagamBackground';
import { generateInitialPiagamLayout, toRoman, getTextWidth, PIAGAM_WIDTH, PIAGAM_HEIGHT, PIAGAM_VIEWBOX } from './utils';
import { getTanggalRaporValue, getContextualValue } from '../../constants';

export const PiagamPage = ({ student, settings, pageStyle, rank, average, printOptions }: any) => {
    const currentSemester = settings?.semester || 'Ganjil';
    const layoutField = currentSemester === 'Genap' ? 'piagam_layout_Genap' : 'piagam_layout';
    
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
        : generateInitialPiagamLayout(settings);

    // Calculate rank string and dynamic dimensions
    const rankString = useMemo(() => {
        if (!rank) return '';
        return `PERINGKAT ${toRoman(rank)}`;
    }, [rank]);

    const { dynamicBoxWidth, dynamicBoxX } = useMemo(() => {
        const rankTextDef = layout.find((el: any) => el.id === 'rank_text');
        if (rankTextDef && rankString) {
            const fontSize = rankTextDef.fontSize || 24;
            const fontFamily = rankTextDef.fontFamily || 'Tinos';
            const fontWeight = rankTextDef.fontWeight || 'bold';
            const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}`;
            const textWidth = getTextWidth(rankString, fontSpec);
            
            // "lebar persegi panjang menjadi teks nama peringkat ditambah 4 spasi (kiri dan kanan)"
            const fourSpacesWidth = getTextWidth('    ', fontSpec); 
            const padding = fourSpacesWidth * 2; // Left + Right
            
            const width = textWidth + padding; 
            
            // Center box relative to the text element's visual center
            const textCenterX = (rankTextDef.x || 0) + ((rankTextDef.width || 0) / 2);
            const x = textCenterX - (width / 2);
            
            return { dynamicBoxWidth: width, dynamicBoxX: x };
        }
        return { dynamicBoxWidth: 300, dynamicBoxX: (PIAGAM_WIDTH - 300) / 2 };
    }, [layout, rankString]);

    const replacePlaceholders = (text: string) => {
        if (!text) return '';
        const classRoman = toRoman(parseInt(settings.nama_kelas, 10)) || settings.nama_kelas;
        
        const tanggalRaporValue = getTanggalRaporValue(settings) || 'Tempat, Tanggal Rapor';
        
        let result = text
            .replace(/\[NAMA SISWA\]/gi, (student.namaLengkap || ''))
            .replace(/\[RANK\]/gi, rank ? toRoman(rank) : '')
            .replace(/\[RANK TEXT\]/gi, rankString)
            .replace(/PERINGKAT \[RANK\]/gi, rankString)
            .replace(/\[nama kelas\]/gi, classRoman)
            .replace(/\[semester\]/gi, settings.semester || '')
            .replace(/\[tahun pelajaran\]/gi, settings.tahun_ajaran || '')
            .replace(/\[nilai rata-rata\]/gi, average || '')
            .replace(/\[nama kepala sekolah\]/gi, getContextualValue(settings, 'nama_kepala_sekolah') || '')
            .replace(/\[nip kepala sekolah\]/gi, getContextualValue(settings, 'nip_kepala_sekolah') || '')
            .replace(/\[nama wali kelas\]/gi, getContextualValue(settings, 'nama_wali_kelas') || '')
            .replace(/\[nip wali kelas\]/gi, getContextualValue(settings, 'nip_wali_kelas') || '')
            .replace(/Tempat, Tanggal Rapor/gi, tanggalRaporValue);

        const nipKepsekLabel = getContextualValue(settings, 'nip_label_kepala_sekolah') || 'NIP';
        const nipWaliLabel = getContextualValue(settings, 'nip_label_wali_kelas') || 'NIP';

        if (text.toLowerCase().includes('[nip kepala sekolah]')) {
            result = result.replace(/NIP\./gi, `${nipKepsekLabel}.`);
        } else if (text.toLowerCase().includes('[nip wali kelas]')) {
            result = result.replace(/NIP\./gi, `${nipWaliLabel}.`);
        } else {
            if (getContextualValue(settings, 'nip_kepala_sekolah') && result.includes(`NIP. ${getContextualValue(settings, 'nip_kepala_sekolah')}`)) {
                result = result.replace(`NIP. ${getContextualValue(settings, 'nip_kepala_sekolah')}`, `${nipKepsekLabel}. ${getContextualValue(settings, 'nip_kepala_sekolah')}`);
            }
            if (getContextualValue(settings, 'nip_wali_kelas') && result.includes(`NIP. ${getContextualValue(settings, 'nip_wali_kelas')}`)) {
                result = result.replace(`NIP. ${getContextualValue(settings, 'nip_wali_kelas')}`, `${nipWaliLabel}. ${getContextualValue(settings, 'nip_wali_kelas')}`);
            }
        }
        return result;
    };

    return (
        <div className="report-page bg-white shadow-lg border box-border relative font-times" style={pageStyle}>
            {settings.piagam_background && <img 
                src={settings.piagam_background} 
                alt="Piagam Background" 
                className="absolute top-0 left-0 w-full h-full object-cover" 
            />}
            <div style={{ position: 'absolute', top: '0.5cm', left: '0.5cm', right: '0.5cm', bottom: '0.5cm' }}>
                <svg width="100%" height="100%" viewBox={PIAGAM_VIEWBOX} preserveAspectRatio="xMidYMid meet">
                    {!settings.piagam_background && <DefaultPiagamBackground PIAGAM_WIDTH={PIAGAM_WIDTH} PIAGAM_HEIGHT={PIAGAM_HEIGHT} />}
                    {layout.map((el: any) => {
                        let currentEl = { ...el };
                        
                        // Dynamic Rank Box
                        if (el.id === 'rank_box') {
                            currentEl.width = dynamicBoxWidth;
                            currentEl.x = dynamicBoxX;
                            // Sync Y position with text offset to ensure vertical centering
                            currentEl.y = el.y + 1;
                        }
                        
                        // Dynamic Rank Text Y Adjustment
                        if (el.id === 'rank_text') {
                            currentEl.y = el.y + 3;
                        }

                        // Use array for multiple elements (signature images injection)
                        const elementsToRender = [];

                        if (currentEl.type === 'text') {
                            let textAnchor = "start", xPos = currentEl.x;
                            if (currentEl.textAlign === 'center') { textAnchor = "middle"; xPos = currentEl.x + (currentEl.width ?? 0) / 2; }
                            else if (currentEl.textAlign === 'right') { textAnchor = "end"; xPos = currentEl.x + (currentEl.width ?? 0); }
                            
                            if (currentEl.id === 'piagam_title') {
                                // MANUAL LAYERING FOR SHADOW (Guarantees Print Output)
                                // Layer 1: Shadow (Gold)
                                elementsToRender.push(
                                    <text
                                        key={`shadow_${currentEl.id}`}
                                        x={xPos + 3}
                                        y={currentEl.y + 3}
                                        fontSize={currentEl.fontSize}
                                        fontWeight={currentEl.fontWeight}
                                        textAnchor={textAnchor as any}
                                        fontFamily={currentEl.fontFamily}
                                        fill="#F59E0B" // Gold Shadow Color
                                        dominantBaseline={currentEl.dominantBaseline || 'auto'}
                                        style={{ userSelect: 'none', letterSpacing: '0.15em' }}
                                    >{replacePlaceholders(currentEl.content)}</text>
                                );
                                // Layer 2: Main Text (Maroon)
                                elementsToRender.push(
                                    <text
                                        key={`main_${currentEl.id}`}
                                        x={xPos}
                                        y={currentEl.y}
                                        fontSize={currentEl.fontSize}
                                        fontWeight={currentEl.fontWeight}
                                        textAnchor={textAnchor as any}
                                        fontFamily={currentEl.fontFamily}
                                        fill={currentEl.fill || '#800000'}
                                        dominantBaseline={currentEl.dominantBaseline || 'auto'}
                                        style={{ userSelect: 'none', letterSpacing: '0.15em' }}
                                    >{replacePlaceholders(currentEl.content)}</text>
                                );
                            } else {
                                // Normal text rendering
                                elementsToRender.push(
                                    <text 
                                        key={`text_${currentEl.id}`}
                                        x={xPos} 
                                        y={currentEl.y} 
                                        fontSize={currentEl.fontSize} 
                                        fontWeight={currentEl.fontWeight} 
                                        textAnchor={textAnchor as any} 
                                        fontFamily={currentEl.fontFamily} 
                                        fill={currentEl.fill || 'black'} 
                                        dominantBaseline={currentEl.dominantBaseline || 'auto'} 
                                        style={{ textDecoration: currentEl.textDecoration || 'none', ...(currentEl.style || {}) }} 
                                    >{replacePlaceholders(currentEl.content)}</text>
                                );
                            }

                            // Inject Images based on specific Text IDs
                            if (currentEl.id === 'headmaster_name') {
                                if (printOptions.showPrincipalSignature && settings.ttd_kepala_sekolah) {
                                    // Signature placed slightly above the name
                                    const sigWidth = 100;
                                    const sigHeight = 70;
                                    // Assuming xPos is center of text box
                                    const sigX = xPos - (sigWidth / 2);
                                    const sigY = currentEl.y - 78; // Centered between label and name
                                    elementsToRender.push(
                                        <image key='sig_head' href={settings.ttd_kepala_sekolah} x={sigX} y={sigY} width={sigWidth} height={sigHeight} preserveAspectRatio="xMidYMid meet" />
                                    );
                                }
                            } else if (currentEl.id === 'teacher_name') {
                                if (printOptions.showTeacherSignature && settings.ttd_wali_kelas) {
                                    const sigWidth = 100;
                                    const sigHeight = 60;
                                    const sigX = xPos - (sigWidth / 2);
                                    const sigY = currentEl.y - 75; // Centered between label and name
                                    elementsToRender.push(
                                        <image key='sig_teacher' href={settings.ttd_wali_kelas} x={sigX} y={sigY} width={sigWidth} height={sigHeight} preserveAspectRatio="xMidYMid meet" />
                                    );
                                }
                            }

                        } else if (currentEl.type === 'image') {
                            const imageUrl = String(settings[currentEl.content] || '');
                            if(imageUrl) elementsToRender.push(<image key={`img_${currentEl.id}`} href={imageUrl} x={currentEl.x} y={currentEl.y} width={currentEl.width} height={currentEl.height} />);
                        } else if (currentEl.type === 'rect' || currentEl.type === 'line') {
                            elementsToRender.push(<rect key={`rect_${currentEl.id}`} x={currentEl.x} y={currentEl.y} width={currentEl.width} height={currentEl.height} fill={currentEl.fill || "black"} rx={currentEl.rx || 0} ry={currentEl.ry || 0} stroke={currentEl.stroke} strokeWidth={currentEl.strokeWidth} />);
                        }

                        return <g key={currentEl.id}>{elementsToRender}</g>;
                    })}
                </svg>
            </div>
        </div>
    );
};
