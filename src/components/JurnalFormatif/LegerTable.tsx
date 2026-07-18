import React, { useMemo } from 'react';

interface LegerTableProps {
  students: any[];
  displaySubjects: any[];
  statistics: any;
  isCompact: boolean;
  nameFontSize?: string;
  nameCellRefs: React.MutableRefObject<(HTMLTableCellElement | null)[]>;
}

export const LegerTable: React.FC<LegerTableProps> = ({
  students,
  displaySubjects,
  statistics,
  isCompact,
  nameFontSize,
  nameCellRefs,
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-200';
    if (rank === 2) return 'bg-slate-300';
    if (rank === 3) return 'bg-orange-200';
    if (rank >= 4 && rank <= 10) return 'bg-indigo-100';
    return '';
  };

  const tableHeader = useMemo(() => (
    <thead className={isCompact ? 'text-[6pt]' : 'text-[6.5pt]'}>
      <tr className="text-center font-bold">
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NO</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NAMA MURID</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NISN</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>NIS</td>
        <td colSpan={displaySubjects.length} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}`}>NILAI MATA PELAJARAN</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>JML</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>RATA-RATA</td>
        <td rowSpan={2} className={`border border-black align-middle ${isCompact ? 'px-0.5 py-0' : 'px-1 py-0'}`}>RANK</td>
      </tr>
      <tr className="text-center font-bold">
        {displaySubjects.map((subject: any) => (
          <td key={subject.id} className="border border-black" style={{ height: isCompact ? '1.75rem' : '2.45rem' }}>
            <div className="h-full flex items-center justify-center">
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: isCompact ? '6.5pt' : '7pt' }}>
                {subject.label}
              </div>
            </div>
          </td>
        ))}
      </tr>
    </thead>
  ), [displaySubjects, isCompact]);

  return (
    <table className={`w-full border-collapse border border-black font-times ${isCompact ? 'text-[7.5pt]' : 'text-[8pt]'}`} style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '3%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '4.5%' }} />
        {displaySubjects.map((_: any, i: number) => <col key={i} style={{ width: `${(100 - 3 - 25 - 9 - 4.5 - 4.5 - 5.5 - 6.5) / displaySubjects.length}%` }} />)}
        <col style={{ width: '4.5%' }} />
        <col style={{ width: '5.5%' }} />
        <col style={{ width: '6.5%' }} />
      </colgroup>
      {tableHeader}
      <tbody className="leading-snug">
        {students.map((student, index) => {
          const rowColor = getRankColor(student.rank);
          
          return (
            <tr key={student.no} className={rowColor ? `${rowColor} border-black` : ''}>
              <td className="border border-black px-1 text-center">{student.no}</td>
              <td 
                ref={el => { nameCellRefs.current[index] = el; }}
                className="border border-black px-2 whitespace-nowrap overflow-hidden"
                style={nameFontSize ? { fontSize: `${nameFontSize}pt`, lineHeight: 1.2 } : {}}
              >
                {student.namaLengkap}
              </td>
              <td className="border border-black px-1 text-center">{student.nisn}</td>
              <td className="border border-black px-1 text-center">{student.nis}</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{student.grades[subject.id] ?? ''}</td>
              ))}
              <td className="border border-black px-1 text-center font-bold">{student.total}</td>
              <td className="border border-black px-1 text-center font-bold">{student.average}</td>
              <td className="border border-black px-1 text-center font-bold">{student.rank}</td>
            </tr>
          );
        })}
        {statistics && (
          <>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Nilai Tertinggi</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].max}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.max}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Nilai Terendah</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].min}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.min}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Total Nilai</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].sum}</td>
              ))}
              <td className="border border-black px-1 text-center">{statistics.total.sum}</td>
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={4} className="border border-black px-2 text-right">Rata-rata Nilai</td>
              {displaySubjects.map((subject: any) => (
                <td key={subject.id} className="border border-black px-1 text-center">{statistics.subjects[subject.id].avg}</td>
              ))}
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-slate-100" />
              <td className="border border-black px-1 bg-white" />
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
};
