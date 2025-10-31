import React, { useState, useEffect } from 'react';
import { P5_DATA } from './p5data.js';

const ASSESSMENT_LEVELS = [
  'Belum Berkembang',
  'Mulai Berkembang',
  'Berkembang sesuai Harapan',
  'Sangat Berkembang'
];

const DataProyekP5Page = ({
    students,
    projects,
    assessments,
    onUpdateProject,
    onDeleteProject,
    onUpdateAssessment,
    showToast
}) => {
    const [activeProjectId, setActiveProjectId] = useState(null);

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
        const newProject = {
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

    const handleProjectChange = (field, value) => {
        if (activeProject) {
            onUpdateProject({ ...activeProject, [field]: value });
        }
    };
    
    const handleAddDimension = (dimensionName) => {
        if (activeProject && !activeProject.dimensions.some(d => d.name === dimensionName)) {
            const newDimension = { name: dimensionName, subElements: [] };
            onUpdateProject({ ...activeProject, dimensions: [...activeProject.dimensions, newDimension] });
        }
    };
    
    const handleDeleteDimension = (dimensionName) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.filter(d => d.name !== dimensionName);
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleAddSubElement = (dimensionName, subElementName) => {
        if (activeProject) {
            const newDimensions = activeProject.dimensions.map(dim => {
                if (dim.name === dimensionName && !dim.subElements.some(sub => sub.name === subElementName)) {
                    const newSubElement = { name: subElementName, targets: [] };
                    return { ...dim, subElements: [...dim.subElements, newSubElement] };
                }
                return dim;
            });
            onUpdateProject({ ...activeProject, dimensions: newDimensions });
        }
    };

    const handleDeleteSubElement = (dimensionName, subElementName) => {
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

    const handleAddTarget = (dimensionName, subElementName, targetName) => {
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
    
    const handleDeleteTarget = (dimensionName, subElementName, targetName) => {
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

    const handleAssessmentChange = (studentId, subElementKey, level) => {
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

    const renderKelolaProyek = () => {
        if (projects.length === 0) {
            return (
                React.createElement('div', { className: "text-center bg-white p-10 rounded-xl shadow-md border border-slate-200" },
                    React.createElement('p', { className: "mt-4 text-slate-600" }, "Belum ada proyek P5 yang ditambahkan."),
                    React.createElement('button', {
                        onClick: handleAddProject,
                        className: "mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    }, "+ Tambah Proyek Baru")
                )
            );
        }

        return (
            React.createElement('div', { className: "space-y-6" },
                React.createElement('div', { className: "flex justify-between items-center" },
                    React.createElement('div', { className: "border-b border-slate-200 flex-grow" },
                        React.createElement('nav', { className: "-mb-px flex space-x-4", "aria-label": "Tabs" },
                            projects.map(project => (
                                React.createElement('button', {
                                    key: project.id,
                                    onClick: () => setActiveProjectId(project.id),
                                    className: `whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                        activeProjectId === project.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`
                                }, project.title)
                            ))
                        )
                    ),
                    React.createElement('button', {
                        onClick: handleAddProject,
                        className: "ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                    }, "+ Tambah Proyek")
                ),

                activeProject && (
                    React.createElement('div', { className: "space-y-8" },
                        React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                            React.createElement('div', { className: "flex justify-between items-center mb-4" },
                                React.createElement('h3', { className: "text-xl font-bold text-slate-800" }, "Data Proyek P5"),
                                React.createElement('button', { onClick: handleDeleteActiveProject, className: "text-sm font-medium text-red-600 hover:text-red-800" }, "Hapus Proyek")
                            ),
                            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "project-title", className: "block text-sm font-medium text-slate-700 mb-1" }, "Nama Proyek"),
                                    React.createElement('input', { id: "project-title", type: "text", value: activeProject.title, onChange: (e) => handleProjectChange('title', e.target.value), className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" })
                                ),
                                React.createElement('div', { className: "md:col-span-2" },
                                    React.createElement('label', { htmlFor: "project-desc", className: "block text-sm font-medium text-slate-700 mb-1" }, "Deskripsi Proyek"),
                                    React.createElement('textarea', { id: "project-desc", rows: 3, value: activeProject.description, onChange: (e) => handleProjectChange('description', e.target.value), className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900" })
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800 mb-4" }, "Dimensi & Target"),
                            React.createElement('div', { className: "space-y-4" },
                                activeProject.dimensions.map((dim, dimIndex) => (
                                    React.createElement('div', { key: dimIndex, className: "p-4 border rounded-lg bg-slate-50/50" },
                                        React.createElement('div', { className: "flex justify-between items-center" },
                                            React.createElement('p', { className: "font-semibold text-indigo-700" }, dim.name),
                                            React.createElement('button', { onClick: () => handleDeleteDimension(dim.name), className: "text-red-500 hover:text-red-700 text-xl font-bold" }, "\u00d7")
                                        ),
                                        React.createElement('div', { className: "pl-4 mt-2 space-y-2" },
                                            dim.subElements.map((sub, subIndex) => (
                                                React.createElement('div', { key: subIndex, className: "p-2 border-l-2" },
                                                    React.createElement('div', { className: "flex justify-between items-center" }, React.createElement('p', { className: "font-medium text-slate-700" }, sub.name), React.createElement('button', { onClick: () => handleDeleteSubElement(dim.name, sub.name), className: "text-red-500 hover:text-red-700 font-bold" }, "\u00d7")),
                                                    React.createElement('div', { className: "pl-4 mt-1" },
                                                        sub.targets.map((target, targetIndex) => (React.createElement('div', { key: targetIndex, className: "flex justify-between items-center text-sm text-slate-600" }, React.createElement('span', null, "- ", target), React.createElement('button', { onClick: () => handleDeleteTarget(dim.name, sub.name, target), className: "text-red-400 hover:text-red-600" }, "\u00d7")))),
                                                        React.createElement('select', { value: "", onChange: (e) => handleAddTarget(dim.name, sub.name, e.target.value), className: "mt-1 w-full text-sm p-1 border-slate-300 rounded" }, React.createElement('option', { value: "", disabled: true }, "+ Tambah Target Pencapaian"), ...(P5_DATA[dim.name]?.[sub.name] || []).filter(t => !sub.targets.includes(t)).map(target => React.createElement('option', { key: target, value: target }, target)))
                                                    )
                                                )
                                            )),
                                            React.createElement('select', { value: "", onChange: (e) => handleAddSubElement(dim.name, e.target.value), className: "mt-2 w-full text-sm p-1 border-slate-300 rounded" }, React.createElement('option', { value: "", disabled: true }, "+ Tambah Sub Elemen"), ...Object.keys(P5_DATA[dim.name] || {}).filter(subName => !dim.subElements.some(s => s.name === subName)).map(subName => React.createElement('option', { key: subName, value: subName }, subName)))
                                        )
                                    )
                                )),
                                React.createElement('select', { value: "", onChange: (e) => handleAddDimension(e.target.value), className: "w-full text-sm font-medium p-2 border-slate-300 rounded-md bg-white hover:bg-slate-50" }, React.createElement('option', { value: "", disabled: true }, "+ Tambah Dimensi"), ...Object.keys(P5_DATA).filter(dimName => !activeProject.dimensions.some(d => d.name === dimName)).map(dimName => React.createElement('option', { key: dimName, value: dimName }, dimName)))
                            )
                        ),

                        React.createElement('div', { className: "bg-white p-6 rounded-xl shadow-md border border-slate-200" },
                            React.createElement('h3', { className: "text-xl font-bold text-slate-800 mb-4" }, "Penilaian Proyek"),
                            subElementsForTable.length > 0 ? (
                                React.createElement('div', { className: "overflow-x-auto" },
                                    React.createElement('table', { className: "w-full text-sm text-left text-slate-500 border-collapse" },
                                        React.createElement('thead', null,
                                            React.createElement('tr', { className: "bg-slate-100" },
                                                React.createElement('th', { scope: "col", className: "px-6 py-3 border border-slate-200 sticky left-0 bg-slate-100 z-10 w-64" }, "Nama Siswa"),
                                                ...subElementsForTable.map(sub => (
                                                    React.createElement('th', { key: sub.key, scope: "col", className: "px-4 py-3 border border-slate-200 w-48 text-center text-xs text-slate-700" },
                                                        React.createElement('div', { className: "font-bold" }, sub.dimension),
                                                        React.createElement('div', { className: "font-normal text-slate-500" }, sub.name)
                                                    )
                                                ))
                                            )
                                        ),
                                        React.createElement('tbody', null,
                                            students.map(student => {
                                                const studentAssessments = assessments.find(a => a.studentId === student.id && a.projectId === activeProject.id);
                                                return (
                                                    React.createElement('tr', { key: student.id, className: "bg-white hover:bg-slate-50" },
                                                        React.createElement('th', { scope: "row", className: "px-6 py-2 border border-slate-200 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10 w-64" }, student.namaLengkap),
                                                        ...subElementsForTable.map(sub => (
                                                            React.createElement('td', { key: sub.key, className: "p-1 border border-slate-200" },
                                                                React.createElement('select', {
                                                                    value: studentAssessments?.assessments[sub.key] || '',
                                                                    onChange: (e) => handleAssessmentChange(student.id, sub.key, e.target.value),
                                                                    className: "w-full h-full p-2 border-0 focus:ring-1 focus:ring-indigo-500 text-xs rounded-md",
                                                                    "aria-label": `Penilaian untuk ${student.namaLengkap} pada ${sub.name}`
                                                                },
                                                                    React.createElement('option', { value: "" }, "-"),
                                                                    ...ASSESSMENT_LEVELS.map(level => (
                                                                        React.createElement('option', { key: level, value: level }, level)
                                                                    ))
                                                                )
                                                            )
                                                        ))
                                                    )
                                                );
                                            })
                                        )
                                    )
                                )
                            ) : (
                                React.createElement('p', { className: "text-center text-slate-500 py-4" }, "Pilih dimensi dan sub elemen di atas untuk memulai penilaian.")
                            )
                        )
                    )
                )
            )
        );
    };

    return (
        React.createElement('div', { className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-3xl font-bold text-slate-800" }, "Data Proyek P5"),
                React.createElement('p', { className: "mt-1 text-slate-600" }, "Kelola proyek dan penilaian Profil Pelajar Pancasila.")
            ),
            
            renderKelolaProyek()
        )
    );
};

export default DataProyekP5Page;
