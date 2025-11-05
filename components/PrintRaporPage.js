import React, { useState, useMemo, useCallback } from 'react';
import { transliterate, generatePemdaText, expandAndCapitalizeSchoolName, generateInitialLayout } from './TransliterationUtil.js';

// Base64 encoded Tut Wuri Handayani logo for offline use and stability
const logoTutWuriHandayani = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEX////8/Pz5+fnr6+vQ0NDk5OTW1tbu7u7i4uLz8/Pj4+O3t7fNzc3S0tLf39/29vbg4ODAwMDt7e3m5ubJycnBwcHc3Nza2trLy8vPz8+rq6vHx8fExMSioqK/v7+kpKScnJyPj4+JiYl+fn5kZGT32x70AAAJyUlEQVR4nO2d63qrOBBAM4oCoqDiitVXddv//5e30LQMSSBhhj3jeb+1s8wlkzCSSc7OaDQajUaj0Wg0Go1Go9FoNBqNRqPRaDQajUaj0Wg0Go1Go9FoNBqNRqPRaDT+H/g3Jv2Dq+Mvkx5Y/jXkY/J/ZfK0g/f/g2v82+A23w9+b/+n8O/D2j/rD/85pB/4dYv/H2j82v/n+T/M0v7x0v7zN0b633/Vf6fD/+T/Uf+P/L+W/18T+n9d/m/g3/T/2/g/vJ6/b/V/n/P/4/v+v5T/k6c/+w+Gf9X//X+p/2dv/fV/+A9u/N/T/7N4x//hX4l/h38f+f/z//D/e/f//4X//v+L//l/bO782f9H+/v/3/7+P+b3/78z+f8L/3/+3/Tf9v8b2/n/P/7f4/+n/D8R/5v+8f9/+x+m/5r/P/uG3/u//b/N/3X/f/r//f/j/5//v/7v/3eP//X/+b8f/v/+T//v/j9a/m/2/f/7/f/0n6T/83/+n+b//9v9v/d//t/Vv+3/l3//z/T/V///1P/z/k/+/wP/X5L/L/y3/L+I/wv/b/9v9v9l/m//b/x/xP+H/7f9v+n/5/9t/b/h/+3/3/5/+P/5f9v/2//d/xP+3/7f/P/c/w//f/+/+v/z/0f/v/b/9P/h/+X/bf8v/H/w/9v/e/3/8f/p//9m9+w/K35o+B1W/A8Bv/39/h6B/+k/4e/L+/3/6f/3++2v679L//b/f/d///0X/e/2/x/8b/f/2/+V+D/h//3+b/v/q/5/Yn//f2D+r/tv9v/n/+X/Z/6/+P/N/23+b/t/c/9/+v/4/4v//4//R/9/8f/z/xf/b/x/+H/b/2v+3/b/Wv8v/P/A/3/y/6v+P+L/G//f+f/1/8v/3/x/3f/X/R/+P/1f/n/V/9v+3/7f3P+H/xf9f9v/G/+f/7/l/8v/Z//v/H/O//d+P/7/+P+z/4v/b/5v+H+r/0//b/b/tv/3/7f/l/+P+b/v/9f+3/z//f/Z/1v+X/v/4f9n//4k/1/3/47/L/1f+f/7f1X/v/D/dv+3/z//f/7f2P/X/2/9v+X//wT/b/7//v/S//v+X/t/G/8v+P/t/83+f/z/kv+v/z/+/xD/5/8v/L/8v+n/p/9n/x//P/n/8/+H/+f+v/b/1P/f/p/+/0//L/6/Wv+f/n/b/4//7/x/1//v/n/+P/t/m/9//v/R/y//T/+f8//7/+P+z/4v/b/p/4f+V//f7v/3/1P+H/9f7f+7/L/p/s/9n/y/8v8P/z/0/+f/3/7f/b/y//X/v/m/+H/7f7v/l/7f+3/9f+X/v/5f8v/X/l/wv/X//f8f97/8/9f87/+3/L/5f+3/9f6/7/vP8X/f/1/xP/n/+/9v/G/6/9P9v+3+7/+v/H/R/+f+39T/w//T//f7f9X/7/+X/5f+f93+7/+f/7/+n/5/8v/b/3/qf+n/6f+v+n/r//f/j/6/6f6/+/+z/x//r/v/8v+L//f7v/1/9P+r/p/+X+L/5/9v9n/b/pv+X/5/7P/Z//v+f+L/3f+v/7/1/z/9/+H/x/+n//f5v/+/6f9f9//h//X/5/7v9n/3/9//f9z/x/8/8P/z/3/z/2f/D/6v+f/3/7/+39z/R/+/8P9//+//Z/+//r/S/+/+H/r/t/x/+X/+/+v+7/a/1//p/9f9P9P/a/wv/b/1/m//3/4//39T/h//X/f/p/3//L/b/wv+P/2//b/y/+b/J/4f/l/+v+3/z/y/y//L/x/+P+//x//f/T/a/z/+H/b/y/7P/x/9v83/S/+f/L/4//n/2/7/2n9v/7/e/0/8//x//P/r//fzP7/Vf8v9f9T/6/9P/n/8/+//H//f2P+3/b/j/+v/L/i/5f/v/b/vP+//z/L/j/6/+P/x/8v/T/d/+v/n/t/9n9n/r/W/+v/H/t/6/4/+f+v+//L/n/8f+f/x/z/9/+P+T/4f/1/5f8//h/+v+P/z/z/0f/v/L/d//v/p/+/yr/f/l/+P+n/y/+f/v/4f/v/1v9f+v/R/+/7/9P+b/1/6f+v+z/9f/P/V/+f/n/R/+P+//d/x/9f/z/8f8X/2/5v+r/v/f/kv+f//9x/9/8v/P/q//P/7/Wv9//L/o/5v9/8T/j//f/L/h/5f/H/+/6f7v9f+L//f+v9P/v/8/8f+H/7f9v/7/8v/R/5//v/l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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP43/gMAqS6T1h40tQAAAABJRU5ErkJggg==";

const ReportHeader = ({ settings }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return (
        React.createElement('div', { className: "absolute top-0 left-0 right-0", style: { height: '5.2cm', padding: '1cm 1.5cm 0 1.5cm' } },
            React.createElement('div', { className: "relative w-full h-full" },
                React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 180", preserveAspectRatio: "xMidYMin meet" },
                    layout.map(el => {
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
                                    fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'Poppins'
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


const getGradeNumber = (str) => {
    if (!str) return null;
    const match = str.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    const upperStr = str.toUpperCase();
    if (upperStr.includes('VI')) return 6;
    if (upperStr.includes('V')) return 5;
    if (upperStr.includes('IV')) return 4;
    if (upperStr.includes('III')) return 3;
    if (upperStr.includes('II')) return 2;
    if (upperStr.includes('I')) return 1;
    return null;
};

const formatDate = (dateString) => {
    if (!dateString || dateString instanceof Date && isNaN(dateString)) return '-';
    try {
        const date = new Date(dateString);
        // add timezone offset to prevent off-by-one day errors
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        
        if (isNaN(adjustedDate.getTime())) {
            return String(dateString); // Return original string if date is invalid
        }

        return adjustedDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return String(dateString); // Return original string on error
    }
};

const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const lowercaseFirst = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};


const generateDescription = (student, subject, gradeData, learningObjectives, settings) => {
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);
    const defaultReturn = { highest: `Ananda ${studentName} telah mencapai tujuan pembelajaran.`, lowest: '' };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) {
        return { highest: "Nama kelas belum diatur.", lowest: "" };
    }
    
    let objectivesForCurrentClass = null;
    for (const key in learningObjectives) {
        if (getGradeNumber(key) === currentGradeNumber) {
            objectivesForCurrentClass = learningObjectives[key];
            break;
        }
    }

    const objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
    if (!objectivesForSubject || objectivesForSubject.length === 0) {
        return { highest: "Tujuan Pembelajaran belum diisi.", lowest: "" };
    }

    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    const gradedTps = objectivesForSubject
        .map((text, index) => ({ text, score: detailedGrade?.tp?.[index] }))
        .filter(tp => typeof tp.score === 'number' && tp.score !== null);
    
    if (gradedTps.length === 0) {
        return { highest: "Nilai TP belum diisi.", lowest: "" };
    }
    
    if (gradedTps.length === 1) {
        return { highest: `Ananda ${studentName} menunjukkan penguasaan yang baik dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' };
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        return { 
            highest: `Ananda ${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        };
    } else {
        let maxScore = -1;
        let minScore = 101;
        scores.forEach(s => {
            if (s > maxScore) maxScore = s;
            if (s < minScore) minScore = s;
        });
        
        const highestTp = gradedTps.find(tp => tp.score === maxScore);
        const lowestTp = gradedTps.find(tp => tp.score === minScore);
        
        if (highestTp && lowestTp) {
            return { 
                highest: `Ananda ${studentName} menunjukkan penguasaan yang sangat baik dalam ${lowercaseFirst(highestTp.text)}.`,
                lowest: `Ananda ${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
            };
        }
    }

    return { highest: "Tidak dapat membuat deskripsi.", lowest: "" };
};

const CoverPage = ({ student, settings }) => {
    const year = useMemo(() => {
        if (settings.tanggal_rapor) {
            try {
                // Handle format "Denpasar, 20 Desember 2024"
                const parts = settings.tanggal_rapor.split(' ');
                if (parts.length >= 3) {
                    const yearPart = parts[parts.length - 1];
                    const reportYear = parseInt(yearPart, 10);
                    const monthName = parts[parts.length - 2];
                    const monthIndex = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].indexOf(monthName.toLowerCase());

                    if (!isNaN(reportYear) && monthIndex !== -1) {
                        // If report date is in the first half of the year (Jan-June), it belongs to the previous academic year end
                        if (monthIndex < 6) {
                            return `${reportYear - 1}/${reportYear}`;
                        }
                        return `${reportYear}/${reportYear + 1}`;
                    }
                }
            } catch (e) { /* Fallback below */ }
        }
        if (settings.tahun_ajaran) {
            return settings.tahun_ajaran;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        if (currentMonth < 6) {
             return `${currentYear - 1}/${currentYear}`;
        }
        return `${currentYear}/${currentYear + 1}`;
    }, [settings.tanggal_rapor, settings.tahun_ajaran]);

    const coverLogo = settings.logo_cover || logoTutWuriHandayani;

    return React.createElement('div', { className: 'h-full flex flex-col items-center text-center p-8 report-cover-border' },
        React.createElement('div', { className: 'w-full pt-16' },
            React.createElement('div', { className: 'flex justify-center mb-10' },
                React.createElement('img', {
                    src: coverLogo,
                    alt: "Logo Cover Rapor",
                    className: 'h-48 w-48 object-contain'
                })
            ),
            React.createElement('h1', { className: 'text-2xl font-bold tracking-widest' }, 'RAPOR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'MURID'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'SEKOLAH DASAR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, '(SD)'),

            React.createElement('div', { className: 'mt-24 w-full px-8' },
                React.createElement('p', { className: 'text-sm' }, 'Nama Murid:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, (student.namaLengkap || 'NAMA MURID').toUpperCase())
                ),
                React.createElement('p', { className: 'text-sm mt-4' }, 'NISN/NIS:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-2' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, `${student.nisn || '-'} / ${student.nis || '-'}`)
                )
            )
        ),
        React.createElement('div', { className: 'flex-grow' }),
        React.createElement('div', { className: 'mb-8 space-y-2' },
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'REPUBLIK INDONESIA'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, year)
        )
    );
};

const SchoolIdentityPage = ({ settings }) => {
    const identitasSekolah = [
        { label: "Nama Sekolah", value: settings.nama_sekolah },
        { label: "NPSN", value: settings.npsn },
        { label: "NIS/NSS/NDS", value: '-'},
        { label: "Alamat Sekolah", value: settings.alamat_sekolah },
        { label: 'Kelurahan/Desa', value: settings.desa_kelurahan },
        { label: 'Kecamatan', value: settings.kecamatan },
        { label: 'Kabupaten/Kota', value: settings.kota_kabupaten },
        { label: 'Provinsi', value: settings.provinsi },
        { label: 'Website', value: settings.website_sekolah },
        { label: 'E-mail', value: settings.email_sekolah },
        { label: 'Kode Pos', value: settings.kode_pos },
        { label: 'Telepon', value: settings.telepon_sekolah },
    ];

    return(
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-12', style: { fontSize: '14pt' } }, 'IDENTITAS SEKOLAH'),
             React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-2' }, `${index + 1}.`),
                            React.createElement('td', { className: 'w-[30%] py-2' }, item.label),
                            React.createElement('td', { className: 'w-[5%] py-2' }, ':'),
                            React.createElement('td', { className: 'w-[60%] py-2' }, item.value || '-')
                        )
                    ))
                )
            )
        )
    );
};

const StudentIdentityPage = ({ student, settings }) => {
    const identitasSiswa = [
        { no: '1.', label: 'Nama Murid', value: (student.namaLengkap || '').toUpperCase() },
        { no: '2.', label: 'NISN/NIS', value: `${student.nisn || '-'} / ${student.nis || '-'}` },
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: `${student.tempatLahir || ''}, ${formatDate(student.tanggalLahir)}` },
        { no: '4.', label: 'Jenis Kelamin', value: student.jenisKelamin },
        { no: '5.', label: 'Agama', value: student.agama },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { no: '7.', label: 'Alamat Murid', value: student.alamatSiswa },
        { no: '8.', label: 'Nama Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.namaAyah },
        { sub: true, label: 'b. Ibu', value: student.namaIbu },
        { no: '9.', label: 'Pekerjaan Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.pekerjaanAyah },
        { sub: true, label: 'b. Ibu', value: student.pekerjaanIbu },
        { no: '10.', label: 'Alamat Orang Tua', value: student.alamatOrangTua },
        { no: '11.', label: 'Wali Murid' },
        { sub: true, label: 'a. Nama', value: student.namaWali },
        { sub: true, label: 'b. Pekerjaan', value: student.pekerjaanWali },
        { sub: true, label: 'c. Alamat', value: student.alamatWali },
    ];
    
    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-12', style: { fontSize: '14pt' } }, 'IDENTITAS MURID'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSiswa.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-1' }, item.no || ''),
                            React.createElement('td', { className: `w-[35%] py-1 ${item.sub ? 'pl-4' : ''}` }, item.label),
                            React.createElement('td', { className: 'w-[3%] py-1 text-center' }, item.label ? ':' : ''),
                            React.createElement('td', { className: 'w-[57%] py-1' }, item.value || (item.sub ? '-' : ''))
                        )
                    ))
                )
            ),
            React.createElement('div', { className: 'flex justify-between items-end pt-10' },
                React.createElement('div', { className: 'w-32 h-40 border-2 flex items-center justify-center text-slate-400' }, 'Pas Foto 3x4'),
                React.createElement('div', { className: 'text-center' },
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`),
                    React.createElement('div', { className: 'mt-1' }, 'Kepala Sekolah,'),
                    React.createElement('div', { className: 'h-20' }),
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'),
                    React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                )
            )
        )
    );
};

const ReportStudentInfo = ({ student, settings }) => (
    React.createElement('table', { className: 'w-full mb-4', style: { fontSize: '11pt' } },
        React.createElement('tbody', null,
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'w-[20%] py-1 px-2' }, 'Nama Murid'), React.createElement('td', { className: 'w-[45%] py-1 px-2' }, `: ${(student.namaLengkap || '').toUpperCase()}`),
                React.createElement('td', { className: 'w-[15%] py-1 px-2' }, 'Kelas'), React.createElement('td', { className: 'w-[20%] py-1 px-2' }, `: ${settings.nama_kelas || ''}`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'NISN/NIS'), React.createElement('td', { className: 'py-1 px-2' }, `: ${student.nisn || '-'} / ${student.nis || '-'}`),
                React.createElement('td', { className: 'py-1 px-2' }, 'Fase'), React.createElement('td', { className: 'py-1 px-2' }, `: C`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'Nama Sekolah'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.nama_sekolah || ''}`),
                React.createElement('td', { className: 'py-1 px-2' }, 'Semester'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.semester ? (settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)') : '2'}`)
            ),
            React.createElement('tr', { className: 'align-top' },
                React.createElement('td', { className: 'py-1 px-2' }, 'Alamat Sekolah'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.alamat_sekolah || ''}`),
                React.createElement('td', { className: 'whitespace-nowrap py-1 px-2' }, 'Tahun Pelajaran'), React.createElement('td', { className: 'py-1 px-2' }, `: ${settings.tahun_ajaran || ''}`)
            )
        )
    )
);

const AcademicTable = ({ subjectsToRender, startingIndex = 1 }) => (
    React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-2', style: { fontSize: '11pt' } },
        React.createElement('thead', { className: "report-header-group" },
            React.createElement('tr', { className: 'font-bold text-center' },
                React.createElement('td', { className: 'border-2 border-black p-2 w-[5%]' }, 'No.'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[20%]' }, 'Mata Pelajaran'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[8%] whitespace-nowrap' }, 'Nilai Akhir'),
                React.createElement('td', { className: 'border-2 border-black p-2 w-[67%]' }, 'Capaian Kompetensi')
            )
        ),
        React.createElement('tbody', null,
            subjectsToRender.map((item, index) => (
                React.createElement('tr', { key: item.id },
                    React.createElement('td', { className: 'border border-black px-2 py-1 text-center align-top' }, startingIndex + index),
                    React.createElement('td', { className: 'border border-black px-2 py-1 align-top' }, item.name),
                    React.createElement('td', { className: 'border border-black px-2 py-1 text-center align-top' }, item.grade ?? ''),
                    React.createElement('td', { className: 'border border-black px-2 py-1 align-top text-justify' },
                        React.createElement('p', {className: 'mb-1'}, item.description.highest),
                        item.description.lowest && React.createElement(React.Fragment, null,
                            React.createElement('hr', { className: 'border-t border-slate-400 my-1' }),
                            React.createElement('p', null, item.description.lowest)
                        )
                    )
                )
            ))
        )
    )
);

const ReportFooterContent = ({ student, settings, attendance, notes, studentExtracurriculars, extracurriculars }) => {
    const attendanceData = attendance.find(a => a.studentId === student.id) || { sakit: 0, izin: 0, alpa: 0 };
    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    const studentNote = notes[student.id] || '';
    
    const extraActivities = (studentExtraData?.assignedActivities || [])
        .map(activityId => {
            if (!activityId) return null;
            const activity = extracurriculars.find(e => e.id === activityId);
            const description = studentExtraData.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.';
            return { name: activity?.name, description };
        }).filter(Boolean);

    const renderDecision = () => {
        const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
        if (!isSemesterGenap) return null;

        const gradeLevel = getGradeNumber(settings.nama_kelas);
        let passText, failText, passTo, failTo;

        if (gradeLevel === 6) {
            passText = 'LULUS';
        } else {
            passText = 'Naik ke Kelas';
            const nextGrade = gradeLevel ? gradeLevel + 1 : '';
            const nextGradeRomanPlusOne = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII'}[nextGrade];
            passTo = `${nextGrade} (${nextGradeRomanPlusOne})`;
        }
        
        return React.createElement('div', { className: 'border-2 border-black p-2 mt-4' },
            React.createElement('div', { className: 'font-bold' }, 'Keputusan: '),
            React.createElement('div', null, 'Berdasarkan pencapaian seluruh kompetensi, murid dinyatakan:'),
            React.createElement('div', { className: 'font-bold mt-1 border-y-2 border-black text-center py-1' }, 
                `${passText} ${passTo || ''}`.trim()
            )
        );
    };

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'mt-4 signature-block'},
                React.createElement('table', { className: 'w-full border-collapse border-2 border-black', style: { fontSize: '11pt' } },
                    React.createElement('thead', { className: "report-header-group" }, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: 'border-2 border-black p-2 w-[5%]' }, 'No.'), React.createElement('td', { className: 'border-2 border-black p-2 w-[25%]' }, 'Ekstrakurikuler'), React.createElement('td', { className: 'border-2 border-black p-2 w-[70%]' }, 'Keterangan'))),
                    React.createElement('tbody', null, extraActivities.length > 0 ? extraActivities.map((item, index) => (React.createElement('tr', { key: index, className: 'align-top' }, React.createElement('td', { className: 'border border-black px-2 py-1 text-center' }, index + 1), React.createElement('td', { className: 'border border-black px-2 py-1' }, item.name), React.createElement('td', { className: 'border border-black px-2 py-1' }, item.description)))) : React.createElement('tr', null, React.createElement('td', { colSpan: 3, className: 'border border-black p-2 text-center h-8' }, '-')))
                )
            ),
            React.createElement('div', { className: 'border-2 border-black p-2 mt-4 signature-block', style: { fontSize: '11pt' } }, React.createElement('div', { className: 'font-bold mb-1' }, 'Catatan Wali Kelas'), React.createElement('div', { className: 'h-16' }, studentNote || 'Tidak ada catatan.')),
            
            React.createElement('div', { className: 'grid grid-cols-2 gap-4 signature-block' },
                React.createElement('table', { className: 'border-collapse border-2 border-black mt-4', style: { fontSize: '11pt' } },
                    React.createElement('thead', { className: "report-header-group" }, React.createElement('tr', { className: 'font-bold' }, React.createElement('td', { colSpan: 2, className: 'border-2 border-black p-2' }, 'Ketidakhadiran'))),
                    React.createElement('tbody', null,
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 w-2/3 pl-4' }, 'Sakit'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.sakit} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 pl-4' }, 'Izin'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.izin} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-1 pl-4' }, 'Tanpa Keterangan'), React.createElement('td', { className: 'border border-black px-2 py-1' }, `: ${attendanceData.alpa} hari`))
                    )
                ),
                React.createElement('div', { className: 'signature-block' }, renderDecision())
            ),
            React.createElement('div', { className: 'signature-block mt-8 flex justify-between', style: { fontSize: '12pt' } },
                React.createElement('div', { className: 'text-center' }, React.createElement('div', null, 'Mengetahui:'), React.createElement('div', null, 'Orang Tua/Wali,'), React.createElement('div', { className: 'h-20' }), React.createElement('div', { className: 'font-bold' }, '(.........................)')),
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`), 
                    React.createElement('div', null, 'Wali Kelas,'), 
                    React.createElement('div', { className: 'h-20' }), 
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'), 
                    React.createElement('div', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
            React.createElement('div', { className: 'signature-block mt-6 flex justify-center text-center', style: { fontSize: '12pt' } }, React.createElement('div', null, React.createElement('div', null, 'Mengetahui,'), React.createElement('div', null, 'Kepala Sekolah,'), React.createElement('div', { className: 'h-20' }), React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'), React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)))
        )
    );
};

const ReportPagesForStudent = ({ student, settings, pageStyle, selectedPages, ...restProps }) => {
    const { grades, subjects, learningObjectives, attendance, notes, extracurriculars, studentExtracurriculars } = restProps;
    const gradeData = grades.find(g => g.studentId === student.id);
    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);

    const reportSubjects = useMemo(() => {
        const result = [];
        const processedGroups = new Set();
        const allActiveSubjects = subjects.filter(s => s.active);
        
        const groupConfigs = {
            'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
                const studentReligion = student.agama?.trim().toLowerCase();
                const representative = groupSubjects.find(s => {
                    const match = s.fullName.match(/\(([^)]+)\)/);
                    return match && match[1].trim().toLowerCase() === studentReligion;
                });
                return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
            },
            'Seni Budaya': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects.find(s => s.fullName.includes("Seni Rupa")) || groupSubjects[0];
                return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
            },
            'Muatan Lokal': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
                if (chosen) {
                    const match = chosen.fullName.match(/\(([^)]+)\)/);
                    return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
                }
                return null;
            }
        };

        Object.keys(groupConfigs).forEach(groupName => {
            if (processedGroups.has(groupName)) return;
            const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
            if (groupSubjects.length > 0) {
                const config = groupConfigs[groupName](groupSubjects);
                if (config && config.subject) {
                     const grade = gradeData?.finalGrades?.[config.subject.id];
                     const description = generateDescription(student, config.subject, gradeData, learningObjectives, settings);
                     result.push({ id: config.subject.id, name: config.name, grade: grade, description: description });
                }
                processedGroups.add(groupName);
            }
        });
        
        allActiveSubjects.forEach(subject => {
            const isGrouped = Object.keys(groupConfigs).some(groupName => subject.fullName.startsWith(groupName));
            if (!isGrouped) {
                const grade = gradeData?.finalGrades?.[subject.id];
                const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                result.push({ id: subject.id, name: subject.fullName, grade: grade, description: description });
            }
        });
        
        const sortOrder = [
            'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 
            'Ilmu Pengetahuan Alam dan Sosial', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 
            'Bahasa Inggris', 'Muatan Lokal'
        ];
        
        const findOriginalFullName = (subjectId) => subjects.find(s => s.id === subjectId)?.fullName || '';

        result.sort((a, b) => {
            const getSortKey = (item) => {
                const originalFullName = findOriginalFullName(item.id);
                if (originalFullName.startsWith('Pendidikan Agama')) return 'Pendidikan Agama dan Budi Pekerti';
                if (originalFullName.startsWith('Seni Budaya')) return 'Seni Budaya';
                if (originalFullName.startsWith('Muatan Lokal')) return 'Muatan Lokal';
                return item.name;
            };
            const aSortKey = getSortKey(a);
            const bSortKey = getSortKey(b);
            const aIndex = sortOrder.findIndex(key => aSortKey.startsWith(key));
            const bIndex = sortOrder.findIndex(key => bSortKey.startsWith(key));
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });
        return result;
    }, [student, subjects, gradeData, learningObjectives, settings]);

    const { needsSplitting, splitPoint } = useMemo(() => {
        const extraCount = (studentExtraData?.assignedActivities || []).filter(Boolean).length;
        const calculatedSplitPoint = extraCount > 2 ? 6 : 7;
        const calculatedNeedsSplitting = reportSubjects.length > calculatedSplitPoint;

        return { 
            needsSplitting: calculatedNeedsSplitting, 
            splitPoint: calculatedSplitPoint 
        };
    }, [student, reportSubjects, studentExtraData]);

    const page1Subjects = needsSplitting ? reportSubjects.slice(0, splitPoint) : reportSubjects;
    const page2Subjects = needsSplitting ? reportSubjects.slice(splitPoint) : [];

    const contentStyle = { padding: '1.5cm' };
    const contentStyleWithHeader = { padding: '1.5cm', paddingTop: '5.2cm' };

    return (
        React.createElement(React.Fragment, null,
            selectedPages.cover && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border', 'data-student-id': String(student.id), 'data-page-type': 'cover', style: pageStyle },
                React.createElement('div', { style: contentStyle, className: "h-full" }, React.createElement(CoverPage, { student: student, settings: settings }))
            ),
            selectedPages.schoolIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: contentStyleWithHeader }, React.createElement(SchoolIdentityPage, { settings: settings }))
            ),
            selectedPages.studentIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings }),
                React.createElement('div', { style: contentStyleWithHeader }, React.createElement(StudentIdentityPage, { student: student, settings: settings }))
            ),
            selectedPages.academic && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: {...pageStyle, height: 'auto'} },
                React.createElement('div', { style: { height: '5.2cm' } }, React.createElement(ReportHeader, { settings: settings })),
                React.createElement('div', { style: { padding: '1.5cm', paddingTop: 0, verticalAlign: 'top' } },
                    React.createElement('div', { className: 'font-times' },
                        React.createElement(ReportStudentInfo, { student: student, settings: settings }),
                        React.createElement(AcademicTable, { subjectsToRender: page1Subjects }),
                        !needsSplitting && React.createElement(ReportFooterContent, { student, settings, attendance, notes, studentExtracurriculars, extracurriculars })
                    )
                )
            ),
            selectedPages.academic && needsSplitting && (
                React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: {...pageStyle, height: 'auto'} },
                    React.createElement('div', { style: { height: '5.2cm' } }, React.createElement(ReportHeader, { settings: settings })),
                    React.createElement('div', { style: { padding: '1.5cm', paddingTop: 0, verticalAlign: 'top' } },
                        React.createElement('div', { className: 'font-times' },
                            React.createElement(ReportStudentInfo, { student: student, settings: settings }),
                            React.createElement(AcademicTable, { subjectsToRender: page2Subjects, startingIndex: splitPoint + 1 }),
                            React.createElement(ReportFooterContent, { student, settings, attendance, notes, studentExtracurriculars, extracurriculars })
                        )
                    )
                )
            )
        )
    );
};


const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

const PrintRaporPage = ({ students, settings, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
    });

    const handlePageSelectionChange = useCallback((e) => {
        const { name, checked } = e.target;
        setSelectedPages(prev => {
            if (name === 'all') {
                return {
                    cover: checked,
                    schoolIdentity: checked,
                    studentIdentity: checked,
                    academic: checked,
                };
            }
            return {
                ...prev,
                [name]: checked,
            };
        });
    }, []);
    
    const handlePrint = () => {
        window.print();
    };

    const studentsToRender = useMemo(() => {
        if (selectedStudentId === 'all') {
            return students;
        }
        return students.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId]);
    
    const pageStyle = {
        width: PAPER_SIZES[paperSize].width,
        height: PAPER_SIZES[paperSize].height,
    };

    const pageCheckboxes = [
        { key: 'cover', label: 'Sampul' },
        { key: 'schoolIdentity', label: 'Identitas Sekolah' },
        { key: 'studentIdentity', label: 'Identitas Murid' },
        { key: 'academic', label: 'Laporan Hasil Belajar' },
    ];

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih murid, halaman, dan ukuran kertas, lalu klik cetak.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'studentSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Pilih Murid'),
                            React.createElement('select', { 
                                id: "studentSelector",
                                value: selectedStudentId,
                                onChange: (e) => setSelectedStudentId(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Murid"),
                                students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                            React.createElement('select', {
                                id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { onClick: handlePrint, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700" }, "Cetak Rapor")
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Pilih Halaman untuk Dicetak:"),
                    React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                        React.createElement('label', { className: "flex items-center space-x-2" }, React.createElement('input', { type: "checkbox", name: "all", checked: Object.values(selectedPages).every(Boolean), onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }), React.createElement('span', { className: "text-sm font-bold" }, "Pilih Semua")),
                        ...pageCheckboxes.map(page => (
                            React.createElement('label', { key: page.key, className: "flex items-center space-x-2" },
                                React.createElement('input', { type: "checkbox", name: page.key, checked: selectedPages[page.key] || false, onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                                React.createElement('span', { className: "text-sm" }, page.label)
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                studentsToRender.map(student => {
                    const studentSelectedPages = {
                        cover: selectedPages.cover,
                        schoolIdentity: selectedPages.schoolIdentity,
                        studentIdentity: selectedPages.studentIdentity,
                        academic: selectedPages.academic
                    };

                    return React.createElement(ReportPagesForStudent, { 
                        key: student.id, 
                        student: student, 
                        settings: settings,
                        pageStyle: pageStyle,
                        selectedPages: studentSelectedPages,
                        ...restProps
                    })
                })
            )
        )
    );
};

export default PrintRaporPage;
