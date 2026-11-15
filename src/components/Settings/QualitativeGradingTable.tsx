import React from 'react';
import { QUALITATIVE_DESCRIPTORS } from '../../constants';
import { computeQualitativeGradingMap, isValidQualitativeGradingMap } from '../../utils/nilaiHelpers';

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

    const qualitativeGradingMap = isValidQualitativeGradingMap(settings.qualitativeGradingMap)
        ? settings.qualitativeGradingMap
        : computeQualitativeGradingMap(predikats);

    const data = [
        { code: 'SB', descriptor: QUALITATIVE_DESCRIPTORS.SB, range: `${valA} - 100`, value: qualitativeGradingMap.SB },
        { code: 'BSH', descriptor: QUALITATIVE_DESCRIPTORS.BSH, range: `${valB} - ${valA - 1}`, value: qualitativeGradingMap.BSH },
        { code: 'MB', descriptor: QUALITATIVE_DESCRIPTORS.MB, range: `${valC} - ${valB - 1}`, value: qualitativeGradingMap.MB },
        { code: 'BB', descriptor: QUALITATIVE_DESCRIPTORS.BB, range: `${valD} - ${valC - 1}`, value: qualitativeGradingMap.BB },
    ];

    return (
             React.createElement('div', { className: "mt-4 text-left" },
                React.createElement('h4', { className: "text-md font-semibold text-slate-700 dark:text-slate-200 mb-2" }, "Penilaian Kualitatif Otomatis (Hanya Baca)"),
                React.createElement('p', { className: "text-xs text-slate-500 dark:text-slate-400 mb-3" }, "Nilai representatif ini dihitung otomatis dari nilai KKM dan rentang di atas."),
                React.createElement('div', { className: "overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" },
                    React.createElement('table', { className: "w-full text-sm border-collapse" },
                        React.createElement('thead', null,
                            React.createElement('tr', { className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" },
                                React.createElement('th', { className: "border-b border-slate-200 dark:border-slate-700 p-3 text-left whitespace-nowrap" }, "Deskriptor"),
                                React.createElement('th', { className: "border-b border-slate-200 dark:border-slate-700 p-3 text-center whitespace-nowrap" }, "Rentang Nilai"),
                                React.createElement('th', { className: "border-b border-slate-200 dark:border-slate-700 p-3 text-center whitespace-nowrap" }, "Nilai Representatif")
                            )
                        ),
                        React.createElement('tbody', null,
                            data.map(item => (
                                React.createElement('tr', { key: item.code, className: "hover:bg-slate-50 dark:hover:bg-slate-800/60" },
                                    React.createElement('td', { className: "border-b border-slate-200 dark:border-slate-800 p-3 whitespace-nowrap text-slate-800 dark:text-slate-200" }, `${item.code} (${item.descriptor})`),
                                    React.createElement('td', { className: "border-b border-slate-200 dark:border-slate-800 p-3 text-center whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-300" }, item.range),
                                    React.createElement('td', { className: "border-b border-slate-200 dark:border-slate-800 p-3 text-center font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap tabular-nums" }, item.value)
                                )
                            ))
                        )
                    )
                )
            )
    );
});
