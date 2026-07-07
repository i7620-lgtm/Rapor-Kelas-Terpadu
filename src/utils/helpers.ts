export const getDynamicRKTFileName = (currentSettings) => {
    const schoolName = String(currentSettings?.nama_sekolah || 'SEKOLAH')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s-]/g, '')
        .replace(/\s+/g, ' ');
    const className = String(currentSettings?.nama_kelas || 'KELAS')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
    const academicYear = String(currentSettings?.tahun_ajaran || 'TAHUN')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const semester = String(currentSettings?.semester || 'SEMESTER')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
    return `RKT_${schoolName}_${className}_${academicYear}_${semester}.xlsx`;
};

export const chunkString = (str, len) => {
    const size = Math.ceil(str.length / len);
    const r = Array(size);
    for (let i = 0; i < size; i++) {
        r[i] = str.substr(i * len, len);
    }
    return r;
};
