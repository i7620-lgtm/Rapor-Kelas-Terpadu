import React from 'react';
import { QUALITATIVE_DESCRIPTORS } from '../../constants';

interface QualitativeGradingTableProps {
    settings: any;
}

export const QualitativeGradingTable = React.memo<QualitativeGradingTableProps>(({ settings }) => {
    const { predikats } = settings;
    if (!predikats) return null;

    const valA = parseInt(predikats.a, 10);
    const valB = parseInt(predikats.b, 10);
    const valC = parseInt(predikats.c, 10);
    const valD = parseInt(predikats.d, 10);

    const qualitativeGradingMap = settings.qualitativeGradingMap && Object.keys(settings.qualitativeGradingMap).length > 0
        ? settings.qualitativeGradingMap
        : {
            SB: Math.round((valA + 100) / 2),
            BSH: Math.round((valB + valA - 1) / 2),
            MB: Math.round((valC + valB - 1) / 2),
            BB: Math.round((0 + valC - 1) / 2),
        };

    const data = [
        { code: 'SB', descriptor: QUALITATIVE_DESCRIPTORS.SB, range: `${valA} - 100`, value: qualitativeGradingMap.SB },
        { code: 'BSH', descriptor: QUALITATIVE_DESCRIPTORS.BSH, range: `${valB} - ${valA - 1}`, value: qualitativeGradingMap.BSH },
        { code: 'MB', descriptor: QUALITATIVE_DESCRIPTORS.MB, range: `${valC} - ${valB - 1}`, value: qualitativeGradingMap.MB },
        { code: 'BB', descriptor: QUALITATIVE_DESCRIPTORS.BB, range: `${valD} - ${valC - 1}`, value: qualitativeGradingMap.BB },
    ];

    return (
             React.createElement('div', { className: "mt-4 text-left" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 mb-2" }, "Penilaian Kualitatif Otomatis (Hanya Baca)"),
                React.createElement('p', { className: "text-xs text-slate-500 mb-3" }, "Nilai representatif ini dihitung otomatis dari nilai KKM dan rentang di atas."),
                React.createElement('div', { className: "overflow-x-auto border rounded-lg bg-white" },
                    React.createElement('table', { className: "w-full text-sm border-collapse" },
                        React.createElement('thead', null,
                            React.createElement('tr', { className: "bg-slate-100" },
                                React.createElement('th', { className: "border-b p-3 text-left whitespace-nowrap" }, "Deskriptor"),
                                React.createElement('th', { className: "border-b p-3 text-center whitespace-nowrap" }, "Rentang Nilai"),
                                React.createElement('th', { className: "border-b p-3 text-center whitespace-nowrap" }, "Nilai Representatif")
                            )
                        ),
                        React.createElement('tbody', null,
                            data.map(item => (
                                React.createElement('tr', { key: item.code, className: "hover:bg-slate-50" },
                                    React.createElement('td', { className: "border-b p-3 whitespace-nowrap" }, `${item.code} (${item.descriptor})`),
                                    React.createElement('td', { className: "border-b p-3 text-center whitespace-nowrap" }, item.range),
                                    React.createElement('td', { className: "border-b p-3 text-center font-bold text-indigo-700 whitespace-nowrap" }, item.value)
                                )
                            ))
                        )
                    )
                )
            )
    );
});
