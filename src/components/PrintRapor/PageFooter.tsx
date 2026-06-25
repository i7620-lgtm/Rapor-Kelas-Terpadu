import React from 'react';
import { PAGE_BOTTOM_MARGIN_CM, PAGE_NUMBER_FOOTER_HEIGHT_CM } from './raporUtils';

interface PageFooterProps {
    student: any;
    settings: any;
    currentPage: number;
}

export const PageFooter: React.FC<PageFooterProps> = ({ student, settings, currentPage }) => {
    const classNameVal = settings.nama_kelas || '';
    const studentName = student.namaLengkap || '';
    const nisn = student.nisn || '-';

    return (
        React.createElement('div', { 
            className: "absolute left-[1.5cm] right-[1.5cm] font-times", 
            style: { 
                bottom: `${PAGE_BOTTOM_MARGIN_CM}cm`,
                fontSize: '10pt',
                height: `${PAGE_NUMBER_FOOTER_HEIGHT_CM}cm`,
            }
        },
            React.createElement('div', { className: "border-t border-slate-400 mb-[20px]", style: { marginTop: '0px' } }),
            React.createElement('div', { className: "flex justify-between items-center" },
                React.createElement('div', null,
                    `${classNameVal} | ${studentName} | ${nisn}`
                ),
                React.createElement('div', null,
                    `Halaman ${currentPage}`
                )
            )
        )
    );
};
