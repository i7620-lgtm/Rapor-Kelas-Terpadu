import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Student, P5Project, P5ProjectAssessment, P5AssessmentLevel, P5ProjectDimension, P5ProjectSubElement } from '../types.ts';
import { P5_DATA } from './p5data.tsx';

declare const XLSX: any;

// Constants
const ASSESSMENT_LEVELS: P5AssessmentLevel[] = [
  'Belum Berkembang',
  'Mulai Berkembang',
  'Berkembang sesuai Harapan',
  'Sangat Berkembang'
];

type P5View = 'KELOLA_PROYEK' | 'UNDUH_UNGGAH';

interface DataProyekP5PageProps {
    students: Student[];
    projects: P5Project[];
    assessments: P5ProjectAssessment[];
    onUpdateProject: (project: P5Project) => void;
    onDeleteProject: (projectId: string) => void;
    onUpdateAssessment: (studentId: number, projectId: string, subElementKey: string, level: P5AssessmentLevel | '') => void;
    onBulkUpdateAssessments: (updates: { studentId: number; projectId: string; subElementKey: string; level: P5AssessmentLevel | ''; }[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const DataProyekP5Page: React.FC<DataProyekP5PageProps> = ({
    students,
    projects,
    assessments,
    onUpdateProject,
    onDeleteProject,
    onUpdateAssessment,
    onBulkUpdateAssessments,
    showToast
}) => {
    const [activeView, setActiveView] = useState<P5View>('KELOLA_PROYEK');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (!activeProjectId && projects.length > 0) {
            setActiveProjectId(projects[0].id);
        }
        if (activeProjectId && !projects.some(p => p.id === activeProjectId)) {
            setActiveProjectId(projects.length > 0 ? projects[0].id : null);
        }
    }, [projects, activeProjectId]);

    const activeProject = projects.find(p => p.id === activeProjectId);

    const handleAddProject = () => {
        const newId = `project_${Date.now()}`;
        const newProject: P5Project = {
            id: newId,
            title: 'Proyek Baru',
            description: '',
            dimensions: []
        };
        onUpdateProject(newProject);
        setActiveProjectId(newId);
    };

    const handleDeleteActiveProject = () => {
        if (activeProject) {
             if (window.confirm(`Apakah Anda yakin ingin menghapus proyek "${activeProject.title}"? Semua data penilaian terkait akan dihapus.`)) {
                onDeleteProject(activeProject.id);
                showToast('Proyek berhasil dihapus.', 'success');
            }
        }
    };

    const handleProjectChange = (field: 'title' | 'description', value: string) => {
        if (activeProject) {
            onUpdateProject({ ...activeProject, [field]: value });
        }
    };
    
    const handleAddDimension = (dimensionName: string) => {
        if (activeProject && !activeProject.dimensions.some(d => d.name === dimensionName)) {
            const newDimension: P5ProjectDimension = { name: dimensionName, subElements: [] };
            onUpdateProject({ ...activeProject, dimensions: [...activeProject.dimensions, newDimension] });
        }
    };
    
    const handleDeleteDimension = (dimensionName: string) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.filter(d => d.name !== dimensionName);
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleAddSubElement = (dimensionName: string, subElementName: string) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.map(dim => {
                if (dim.name === dimensionName && !dim.subElements.some(sub => sub.name === subElementName)) {
                    const newSubElement: P5ProjectSubElement = { name: subElementName, targets: [] };
                    return { ...dim, subElements: [...dim.subElements, newSubElement] };
                }
                return dim;
            });
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleDeleteSubElement = (dimensionName: string, subElementName: string) => {
         if (activeProject) {
            const newDimensions = activeProject.dimensions.map(dim => {
                if (dim.name === dimensionName) {
                    const newSubElements = dim.subElements.filter(sub => sub.name !== subElementName);
                    return { ...dim, subElements: newSubElements };
                }
                return dim;
            });
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleAddTarget = (dimensionName: string, subElementName: string, targetName: string) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.map(dim => {
                if (dim.name === dimensionName) {
                    const newSubElements = dim.subElements.map(sub => {
                        if (sub.name === subElementName && !sub.targets.includes(targetName)) {
                            return { ...sub, targets: [...sub.targets, targetName] };
                        }
                        return sub;
                    });
                    return { ...dim, subElements: newSubElements };
                }
                return dim;
            });
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };
    
    const handleDeleteTarget = (dimensionName: string, subElementName: string, targetName: string) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.map(dim => {
                if (dim.name === dimensionName) {
                    const newSubElements = dim.subElements.map(sub => {
                        if (sub.name === subElementName) {
                            return { ...sub, targets: sub.targets.filter(t => t !== targetName) };
                        }
                        return sub;
                    });
                    return { ...dim, subElements: newSubElements };
                }
                return dim;
            });
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleAssessmentChange = (studentId: number, subElementKey: string, level: P5AssessmentLevel | '') => {
        if (activeProject) {
            onUpdateAssessment(studentId, activeProject.id, subElementKey, level);
        }
    };
    
    const subElementsForTable = activeProject?.dimensions.flatMap(dim => 
        dim.subElements.map(sub => ({
            key: `${dim.name}|${sub.name}`,
            dimension: dim.name,
            name: sub.name,
        }))
    ) || [];

    const handleExportTemplate = useCallback(() => {
        if (typeof XLSX === 'undefined') {
            showToast('Pustaka ekspor (SheetJS) tidak termuat.', 'error');
            return;
        }
        const wb = XLSX.utils.book_new();
        const ws_data = [];
    
        // Create headers
        const machineHeaders = ['studentId', 'namaLengkap'];
        const humanHeaders = ['ID Siswa (Jangan Diubah)', 'Nama Siswa'];
    
        projects.forEach(project => {
            project.dimensions.forEach(dim => {
                dim.subElements.forEach(sub => {
                    const subElementKey = `${dim.name}|${sub.name}`;
                    const machineHeader = `PROJ:${project.id}|KEY:${subElementKey}`;
                    const humanHeader = `${project.title} - ${sub.name}`;
                    machineHeaders.push(machineHeader);
                    humanHeaders.push(humanHeader);
                });
            });
        });
        
        ws_data.push(machineHeaders);
        ws_data.push(humanHeaders);
    
        // Create data rows
        students.forEach(student => {
            const row: (string | number | null)[] = [student.id, student.namaLengkap];
            projects.forEach(project => {
                const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === project.id);
                project.dimensions.forEach(dim => {
                    dim.subElements.forEach(sub => {
                        const subElementKey = `${dim.name}|${sub.name}`;
                        const level = studentAssessments?.assessments[subElementKey] || null;
                        row.push(level);
                    });
                });
            });
            ws_data.push(row);
        });
    
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!rows'] = [{hidden: true}]; // Hide machine-readable headers
        ws['!cols'] = [{wch: 20}, {wch: 30}, ...machineHeaders.slice(2).map(() => ({ wch: 30 }))];
        XLSX.utils.book_append_sheet(wb, ws, "Penilaian P5");
        XLSX.writeFile(wb, "Template_Penilaian_P5.xlsx");
        showToast('Template berhasil diunduh.', 'success');
    }, [projects, students, assessments, showToast]);

    const handleTriggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                if (json.length < 3) {
                    showToast('File tidak valid. Setidaknya harus ada 2 baris header dan 1 baris data siswa.', 'error');
                    return;
                }
    
                const machineHeaders = json[0];
                const studentDataRows = json.slice(2);
                const updates: { studentId: number; projectId: string; subElementKey: string; level: P5AssessmentLevel | ''; }[] = [];
    
                studentDataRows.forEach(row => {
                    const studentId = parseInt(row[0], 10);
                    if (isNaN(studentId) || !students.some(s => s.id === studentId)) {
                        return; // Skip if studentId is invalid or not found
                    }
    
                    for (let i = 2; i < machineHeaders.length; i++) {
                        const header = machineHeaders[i];
                        const cellValue = row[i] || '';
    
                        if (header && typeof header === 'string' && header.startsWith('PROJ:')) {
                            const parts = header.split('|');
                            const projectId = parts[0].replace('PROJ:', '');
                            const subElementKey = parts[1].replace('KEY:', '');
                            
                            const level = ASSESSMENT_LEVELS.includes(cellValue as P5AssessmentLevel) ? (cellValue as P5AssessmentLevel) : '';
                            
                            updates.push({
                                studentId,
                                projectId,
                                subElementKey,
                                level
                            });
                        }
                    }
                });
    
                if (updates.length > 0) {
                    onBulkUpdateAssessments(updates);
                    showToast(`${studentDataRows.length} baris data penilaian P5 berhasil diimpor.`, 'success');
                } else {
                    showToast('Tidak ada data penilaian valid yang ditemukan dalam file.', 'error');
                }
    
            } catch (error) {
                console.error('Error importing P5 data:', error);
                showToast('Terjadi kesalahan saat memproses file.', 'error');
            } finally {
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const inactiveButtonClass = "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors";
    const activeButtonClass = "px-4 py-2 text-sm font-medium text-white bg-indigo-700 border border-indigo-700 rounded-lg shadow-sm";

    const renderKelolaProyek = () => {
        if (projects.length === 0) {
            return (
                <div className="text-center bg-white p-10 rounded-xl shadow-md border border-slate-200">
                    <p className="mt-4 text-slate-600">Belum ada proyek P5 yang ditambahkan.</p>
                    <button
                        onClick={handleAddProject}
                        className="mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah Proyek Baru
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="border-b border-slate-200 flex-grow">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            {projects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setActiveProjectId(project.id)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                        activeProjectId === project.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {project.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <button
                        onClick={handleAddProject}
                        className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    >
                        + Tambah Proyek
                    </button>
                </div>

                {activeProject && (
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-800">Data Proyek P5</h3>
                                <button onClick={handleDeleteActiveProject} className="text-sm font-medium text-red-600 hover:text-red-800">Hapus Proyek</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="project-title" className="block text-sm font-medium text-slate-700 mb-1">Nama Proyek</label>
                                    <input id="project-title" type="text" value={activeProject.title} onChange={(e) => handleProjectChange('title', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="project-desc" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Proyek</label>
                                    <textarea id="project-desc" rows={3} value={activeProject.description} onChange={(e) => handleProjectChange('description', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Dimensi & Target</h3>
                            <div className="space-y-4">
                                {activeProject.dimensions.map((dim, dimIndex) => (
                                    <div key={dimIndex} className="p-4 border rounded-lg bg-slate-50/50">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-indigo-700">{dim.name}</p>
                                            <button onClick={() => handleDeleteDimension(dim.name)} className="text-red-500 hover:text-red-700 text-xl font-bold">&times;</button>
                                        </div>
                                        <div className="pl-4 mt-2 space-y-2">
                                            {dim.subElements.map((sub, subIndex) => (
                                                <div key={subIndex} className="p-2 border-l-2">
                                                    <div className="flex justify-between items-center"><p className="font-medium text-slate-700">{sub.name}</p><button onClick={() => handleDeleteSubElement(dim.name, sub.name)} className="text-red-500 hover:text-red-700 font-bold">&times;</button></div>
                                                    <div className="pl-4 mt-1">
                                                        {sub.targets.map((target, targetIndex) => (<div key={targetIndex} className="flex justify-between items-center text-sm text-slate-600"><span>- {target}</span><button onClick={() => handleDeleteTarget(dim.name, sub.name, target)} className="text-red-400 hover:text-red-600">&times;</button></div>))}
                                                        <select value="" onChange={(e) => handleAddTarget(dim.name, sub.name, e.target.value)} className="mt-1 w-full text-sm p-1 border-slate-300 rounded"><option value="" disabled>+ Tambah Target Pencapaian</option>{(P5_DATA[dim.name]?.[sub.name] || []).filter(t => !sub.targets.includes(t)).map(target => <option key={target} value={target}>{target}</option>)}</select>
                                                    </div>
                                                </div>
                                            ))}
                                            <select value="" onChange={(e) => handleAddSubElement(dim.name, e.target.value)} className="mt-2 w-full text-sm p-1 border-slate-300 rounded"><option value="" disabled>+ Tambah Sub Elemen</option>{Object.keys(P5_DATA[dim.name] || {}).filter(subName => !dim.subElements.some(s => s.name === subName)).map(subName => <option key={subName} value={subName}>{subName}</option>)}</select>
                                        </div>
                                    </div>
                                ))}
                                <select value="" onChange={(e) => handleAddDimension(e.target.value)} className="w-full text-sm font-medium p-2 border-slate-300 rounded-md bg-white hover:bg-slate-50"><option value="" disabled>+ Tambah Dimensi</option>{Object.keys(P5_DATA).filter(dimName => !activeProject.dimensions.some(d => d.name === dimName)).map(dimName => <option key={dimName} value={dimName}>{dimName}</option>)}</select>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Penilaian Proyek</h3>
                            {subElementsForTable.length > 0 ? (
                                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-500 border-collapse"><thead><tr className="bg-slate-100"><th scope="col" className="px-6 py-3 border border-slate-200 sticky left-0 bg-slate-100 z-10 w-64">Nama Siswa</th>{subElementsForTable.map(sub => (<th key={sub.key} scope="col" className="px-4 py-3 border border-slate-200 w-48 text-center text-xs text-slate-700"><div className="font-bold">{sub.dimension}</div><div className="font-normal text-slate-500">{sub.name}</div></th>))}</tr></thead><tbody>{students.map(student => {const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === activeProject.id); return (<tr key={student.id} className="bg-white hover:bg-slate-50"><th scope="row" className="px-6 py-2 border border-slate-200 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10 w-64">{student.namaLengkap}</th>{subElementsForTable.map(sub => (<td key={sub.key} className="p-1 border border-slate-200"><select value={studentAssessments?.assessments[sub.key] || ''} onChange={(e) => handleAssessmentChange(student.id, sub.key, e.target.value as P5AssessmentLevel | '')} className="w-full h-full p-2 border-0 focus:ring-1 focus:ring-indigo-500 text-xs rounded-md" aria-label={`Penilaian untuk ${student.namaLengkap} pada ${sub.name}`}><option value="">-</option>{ASSESSMENT_LEVELS.map(level => (<option key={level} value={level}>{level}</option>))}</select></td>))}</tr>);})}</tbody></table></div>
                            ) : (<p className="text-center text-slate-500 py-4">Pilih dimensi dan sub elemen di atas untuk memulai penilaian.</p>)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderUnduhUnggah = () => (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Unduh dan Unggah Data</h3>
            <p className="text-sm text-slate-500 mt-1">Unduh template data proyek P5 dalam format Excel yang sudah diisi untuk mengimpor data proyek P5 secara massal.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleExportTemplate} 
                    className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center"
                    disabled={projects.length === 0}
                >
                    Unduh Template Data
                </button>
                <button 
                    onClick={handleTriggerImport} 
                    className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-center"
                    disabled={projects.length === 0}
                >
                    Unggah Data Proyek P5
                </button>
            </div>
            {projects.length === 0 && <p className="text-center text-red-600 mt-4 text-sm">Harap buat setidaknya satu proyek di tab 'Kelola Proyek' terlebih dahulu.</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleImportFile} style={{ display: 'none' }} accept=".xlsx, .xls" />
            
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Data Proyek P5</h2>
                <p className="mt-1 text-slate-600">Kelola proyek dan penilaian Profil Pelajar Pancasila.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setActiveView('KELOLA_PROYEK')} className={activeView === 'KELOLA_PROYEK' ? activeButtonClass : inactiveButtonClass}>
                    Kelola Proyek
                </button>
                <button onClick={() => setActiveView('UNDUH_UNGGAH')} className={activeView === 'UNDUH_UNGGAH' ? activeButtonClass : inactiveButtonClass}>
                    Unduh/Unggah Data
                </button>
            </div>
            
            {activeView === 'KELOLA_PROYEK' ? renderKelolaProyek() : renderUnduhUnggah()}
        </div>
    );
};

export default DataProyekP5Page;
