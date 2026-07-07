export const excelRound = (num) => {
    if (num === null || typeof num === 'undefined') return null;
    return Math.round(num + Number.EPSILON);
};

export const calculateFinalGrade = (detailed, config, settings, subjectId, learningObjectivesMap, gradeKey, curriculumKey, predefinedCurriculum = null) => {
    if (!detailed) return null;
    let finalScore = null;
    const { predikats, qualitativeGradingMap, slmVisibility } = settings;
    const kkm = parseInt(predikats?.c || 70, 10);

    const getNumericScore = (score) => {
        if (typeof score === 'number') return score;
        if (typeof score === 'string' && qualitativeGradingMap && qualitativeGradingMap[score]) {
            return qualitativeGradingMap[score];
        }
        return null;
    };
    
    // Filter SLMs based on visibility settings
    const activeSlmIds = slmVisibility?.[subjectId];
    let visibleSlms = activeSlmIds ? (detailed.slm || []).filter(slm => activeSlmIds.includes(slm.id)) : (detailed.slm || []);
    
    const currentSemester = settings.semester || 'Ganjil';
    
    // Filter SLMs by semester if learningObjectives map is provided
    if (learningObjectivesMap && gradeKey && curriculumKey) {
        const objectives = learningObjectivesMap[gradeKey]?.[curriculumKey] || [];
        const slmSemesters = {};
        objectives.forEach(obj => {
             if (obj.slmId) slmSemesters[obj.slmId] = obj.semester || 'Semua';
        });
        
        const preSlms = predefinedCurriculum?.[curriculumKey] || [];
        const preHalf = Math.ceil(preSlms.length / 2);
        
        visibleSlms = visibleSlms.filter(slm => {
             let sem = slmSemesters[slm.id];
             if (!sem && slm.id && slm.id.startsWith('slm_predefined_') && preSlms.length > 0) {
                 const parts = slm.id.split('_');
                 const idx = parseInt(parts[parts.length - 1], 10);
                 if (!isNaN(idx)) {
                     sem = idx < preHalf ? 'Ganjil' : 'Genap';
                 }
             }
             if (!sem) sem = 'Semua';
             return sem === 'Semua' || sem === currentSemester;
        });
    }

    const isGenap = currentSemester === 'Genap';
    const stsField = isGenap ? 'sts2' : 'sts1';
    const sasField = isGenap ? 'sas2' : 'sas1';
    
    const stsVal = (detailed[stsField] !== undefined) ? detailed[stsField] : (isGenap ? null : detailed.sts);
    const sasVal = (detailed[sasField] !== undefined) ? detailed[sasField] : (isGenap ? null : detailed.sas);
    
    if (config.method === 'rata-rata') {
        const slmAvgScores = visibleSlms.map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const stsScore = getNumericScore(stsVal);
        const sasScore = getNumericScore(sasVal);
        
        const avgOfSlms = slmAvgScores.length > 0 ? slmAvgScores.reduce((a, b) => a + b, 0) / slmAvgScores.length : null;
        
        const components = [avgOfSlms, stsScore, sasScore].filter(s => s !== null);
        if (components.length > 0) finalScore = components.reduce((a, b) => a + b, 0) / components.length;

    } else if (config.method === 'pembobotan') {
        let totalWeightedScore = 0;
        let totalWeightUsed = 0;
        const weights = config.weights || {};
        const tpWeights = weights.TP || {};
        const stsWeight = weights.STS || 0;
        const sasWeight = weights.SAS || 0;

        visibleSlms.forEach(slm => {
            const slmTpWeights = tpWeights[slm.id] || [];
            (slm.scores || []).forEach((score, index) => {
                const numericScore = getNumericScore(score);
                const weight = slmTpWeights[index] || 0;
                if (numericScore !== null && weight > 0) {
                    totalWeightedScore += numericScore * (weight / 100);
                    totalWeightUsed += weight;
                }
            });
        });
        
        const stsScore = getNumericScore(stsVal);
        if (stsScore !== null && stsWeight > 0) {
            totalWeightedScore += stsScore * (stsWeight / 100);
            totalWeightUsed += stsWeight;
        }

        const sasScore = getNumericScore(sasVal);
        if (sasScore !== null && sasWeight > 0) {
            totalWeightedScore += sasScore * (sasWeight / 100);
            totalWeightUsed += sasWeight;
        }
        
        finalScore = totalWeightUsed > 0 ? totalWeightedScore : null;

    } else if (config.method === 'persentase' && !isNaN(kkm)) {
        const slmAvgScores = visibleSlms.map(slm => {
            const validScores = (slm.scores || []).map(getNumericScore).filter(s => s !== null);
            return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
        }).filter(avg => avg !== null);
        
        const allSummatives = [...slmAvgScores];
        const stsScore = getNumericScore(stsVal);
        const sasScore = getNumericScore(sasVal);
        if(stsScore !== null) allSummatives.push(stsScore);
        if(sasScore !== null) allSummatives.push(sasScore);
        
        if (allSummatives.length > 0) finalScore = (allSummatives.filter(s => s >= kkm).length / allSummatives.length) * 100;
    }

    return finalScore === null ? null : excelRound(finalScore);
};
