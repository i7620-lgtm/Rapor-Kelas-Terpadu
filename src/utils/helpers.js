export const getDynamicRKTFileName = (currentSettings) => {
    const sanitize = (str) => String(str || '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    const schoolName = sanitize(currentSettings?.nama_sekolah || 'Nama Sekolah');
    const className = sanitize(currentSettings?.nama_kelas || 'Kelas');
    const academicYear = sanitize(currentSettings?.tahun_ajaran || 'TA').replace(/\//g, '-');
    const semester = sanitize(currentSettings?.semester || 'Semester');
    return `RKT_${schoolName}_${className}_${academicYear}_${semester}.xlsx`.toUpperCase();
};

export const chunkString = (str, len) => {
    const size = Math.ceil(str.length / len);
    const r = Array(size);
    for (let i = 0; i < size; i++) {
        r[i] = str.substr(i * len, len);
    }
    return r;
};
