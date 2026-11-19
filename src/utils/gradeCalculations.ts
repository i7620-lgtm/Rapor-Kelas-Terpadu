const excelRound = (num: number | null | undefined) => {
    if (num === null || typeof num === 'undefined') return null;
    return Math.round(num + Number.EPSILON);
};

export const calculateFinalGrade = (detailed, config, settings, subjectId, learningObjectivesMap, gradeKey, curriculumKey, _predefinedCurriculum = null) => {
    if (!detailed) return null;
    let finalScore = null;
    const { predikats, qualitativeGradingMap, slmVisibility } = settings;
    const kkm = parseInt(predikats?.c || 70, 10);

    const getNumericScore = (score) => {
        if (typeof score === 'number') return score;
        if (
            typeof score === 'string' &&
            qualitativeGradingMap &&
            typeof qualitativeGradingMap[score] === 'number' &&
            Number.isFinite(qualitativeGradingMap[score])
        ) {
            return qualitativeGradingMap[score];
        }
        return null;
    };
    
    // Filter SLMs based solely on visibility settings (single active semester)
    const activeSlmIds = slmVisibility?.[subjectId];
    const visibleSlms = activeSlmIds ? (detailed.slm || []).filter(slm => activeSlmIds.includes(slm.id)) : (detailed.slm || []);

    const isGenap = settings?.semester === 'Genap';
    const stsVal =
      detailed.sts !== undefined
        ? detailed.sts
        : (isGenap ? (detailed.sts2 ?? detailed.sts1 ?? null) : (detailed.sts1 ?? detailed.sts2 ?? null));
    const sasVal =
      detailed.sas !== undefined
        ? detailed.sas
        : (isGenap ? (detailed.sas2 ?? detailed.sas1 ?? null) : (detailed.sas1 ?? detailed.sas2 ?? null));
    
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
