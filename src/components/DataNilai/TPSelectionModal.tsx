import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useCurriculumStore } from "../../stores/useCurriculumStore";
import { Search, RefreshCw, CheckSquare, Square, BookOpen, Layers } from "lucide-react";

interface TPSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedTPs: string[]) => void;
  subject: {
    id?: string;
    label?: string;
    fullName?: string;
    curriculumKey?: string;
  };
  availableTPs?: any[];
  isLoading?: boolean;
  currentGrade?: number | null;
}

const GRADE_OPTIONS = [
  { group: "Sekolah Dasar (SD)", options: [
    { value: 1, label: "Kelas 1 (Fase A)" },
    { value: 2, label: "Kelas 2 (Fase A)" },
    { value: 3, label: "Kelas 3 (Fase B)" },
    { value: 4, label: "Kelas 4 (Fase B)" },
    { value: 5, label: "Kelas 5 (Fase C)" },
    { value: 6, label: "Kelas 6 (Fase C)" },
  ]},
  { group: "Sekolah Menengah Pertama (SMP)", options: [
    { value: 7, label: "Kelas 7 (Fase D)" },
    { value: 8, label: "Kelas 8 (Fase D)" },
    { value: 9, label: "Kelas 9 (Fase D)" },
  ]},
  { group: "SMA / SMK", options: [
    { value: 10, label: "Kelas 10 (Fase E)" },
    { value: 11, label: "Kelas 11 (Fase F)" },
    { value: 12, label: "Kelas 12 (Fase F)" },
  ]},
];

export const TPSelectionModal: React.FC<TPSelectionModalProps> = ({
  isOpen,
  onClose,
  onApply,
  subject,
  availableTPs: propAvailableTPs,
  isLoading: propIsLoading,
  currentGrade,
}) => {
  const predefinedCurriculum = useCurriculumStore((state) => state.predefinedCurriculum);
  const activeGradeNumber = useCurriculumStore((state) => state.activeGradeNumber);
  const isLoadingPredefined = useCurriculumStore((state) => state.isLoadingPredefined);
  const loadPredefinedCurriculum = useCurriculumStore((state) => state.loadPredefinedCurriculum);

  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    return currentGrade && currentGrade >= 1 && currentGrade <= 12 ? currentGrade : (activeGradeNumber || 5);
  });
  const [selectedTPs, setSelectedTPs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Sync initial grade when modal opens or currentGrade changes
  useEffect(() => {
    if (isOpen) {
      setSelectedTPs([]);
      setSearchQuery("");
      const targetGrade = currentGrade && currentGrade >= 1 && currentGrade <= 12 ? currentGrade : (activeGradeNumber || 5);
      setSelectedGrade(targetGrade);

      // Trigger fetch on open if curriculum isn't loaded
      setIsLocalLoading(true);
      loadPredefinedCurriculum(targetGrade)
        .catch((err) => console.warn("Error loading curriculum:", err))
        .finally(() => setIsLocalLoading(false));
    }
  }, [isOpen, currentGrade, activeGradeNumber, loadPredefinedCurriculum]);

  // Handle grade level switch inside modal
  const handleGradeChange = useCallback(async (newGrade: number) => {
    setSelectedGrade(newGrade);
    setIsLocalLoading(true);
    try {
      await loadPredefinedCurriculum(newGrade);
    } catch (err) {
      console.warn(`Error loading grade ${newGrade}:`, err);
    } finally {
      setIsLocalLoading(false);
    }
  }, [loadPredefinedCurriculum]);

  // Resolve available TP groups from predefinedCurriculum
  const resolvedGroups = useMemo(() => {
    if (!predefinedCurriculum || typeof predefinedCurriculum !== "object") {
      if (propAvailableTPs && propAvailableTPs.length > 0) return propAvailableTPs;
      return [];
    }

    const curriculumKey = subject?.curriculumKey || subject?.fullName || subject?.label || "";
    
    // Direct exact match
    if (predefinedCurriculum[curriculumKey]) {
      return predefinedCurriculum[curriculumKey];
    }

    // Normalized match
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = normalize(curriculumKey);

    const matchedKey = Object.keys(predefinedCurriculum).find((k) => {
      const kNorm = normalize(k);
      return kNorm === targetNorm || kNorm.includes(targetNorm) || targetNorm.includes(kNorm);
    });

    if (matchedKey && predefinedCurriculum[matchedKey]) {
      return predefinedCurriculum[matchedKey];
    }

    // Subject aliases (e.g. MTK -> Matematika, BIndo -> Bahasa Indonesia, IPAS -> IPA)
    const aliases: Record<string, string[]> = {
      "Matematika": ["mtk", "matematika"],
      "Bahasa Indonesia": ["bindo", "bahasaindonesia"],
      "Bahasa Inggris": ["bing", "bahasainggris"],
      "Pendidikan Pancasila": ["pp", "pkn", "pendidikanpancasila"],
      "Ilmu Pengetahuan Alam dan Sosial": ["ipas", "ipa", "ips", "ilmupengetahuanalamdansosial"],
      "Pendidikan Jasmani, Olahraga, dan Kesehatan": ["pjok", "penjas", "penjasorkes"],
      "Koding dan Kecerdasan Artifisial": ["kka", "koding", "informatika"],
      "Muatan Lokal (Bahasa Bali)": ["bbali", "bahasabali", "mulok"],
    };

    for (const [canonical, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((al) => targetNorm.includes(al))) {
        if (predefinedCurriculum[canonical]) return predefinedCurriculum[canonical];
        const match = Object.keys(predefinedCurriculum).find((k) => normalize(k).includes(normalize(canonical)));
        if (match) return predefinedCurriculum[match];
      }
    }

    if (propAvailableTPs && propAvailableTPs.length > 0) return propAvailableTPs;
    return [];
  }, [predefinedCurriculum, subject, propAvailableTPs]);

  // Filter groups and TPs based on search query
  const filteredGroups = useMemo(() => {
    if (!Array.isArray(resolvedGroups)) return [];
    const query = searchQuery.trim().toLowerCase();

    return resolvedGroups
      .map((group: any) => {
        const slmTitle = group.slm || group.name || "Lingkup Materi";
        const tps: string[] = Array.isArray(group.tp)
          ? group.tp
          : Array.isArray(group.tps)
          ? group.tps.map((t: any) => (typeof t === "string" ? t : t.text || ""))
          : [];

        if (!query) {
          return { slm: slmTitle, tp: tps };
        }

        const matchesSLM = slmTitle.toLowerCase().includes(query);
        const matchedTPs = tps.filter((tpText) => tpText.toLowerCase().includes(query));

        if (matchesSLM) {
          return { slm: slmTitle, tp: tps };
        }

        if (matchedTPs.length > 0) {
          return { slm: slmTitle, tp: matchedTPs };
        }

        return null;
      })
      .filter(Boolean) as { slm: string; tp: string[] }[];
  }, [resolvedGroups, searchQuery]);

  const handleCheckboxChange = (tpText: string) => {
    setSelectedTPs((prev) =>
      prev.includes(tpText) ? prev.filter((t) => t !== tpText) : [...prev, tpText]
    );
  };

  const handleToggleSelectAllInGroup = (groupTPs: string[]) => {
    const allSelected = groupTPs.every((t) => selectedTPs.includes(t));
    if (allSelected) {
      setSelectedTPs((prev) => prev.filter((t) => !groupTPs.includes(t)));
    } else {
      setSelectedTPs((prev) => Array.from(new Set([...prev, ...groupTPs])));
    }
  };

  const handleApply = () => {
    onApply(selectedTPs);
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = isLocalLoading || isLoadingPredefined || (propIsLoading && !predefinedCurriculum);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[80] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Pilih Tujuan Pembelajaran untuk {subject?.label || subject?.fullName || "Mata Pelajaran"}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kurikulum Merdeka Kemendikdasmen terbaru. Centang TP yang ingin dimasukkan ke dalam penilaian.
            </p>
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <label htmlFor="grade-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Jenjang:
            </label>
            <select
              id="grade-select"
              value={selectedGrade}
              onChange={(e) => handleGradeChange(Number(e.target.value))}
              className="text-xs font-medium bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {GRADE_OPTIONS.map((grp) => (
                <optgroup key={grp.group} label={grp.group}>
                  {grp.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar & Counter */}
        <div className="px-4 py-2.5 sm:px-5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci materi atau TP..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {selectedTPs.length} TP dipilih
            </span>
            {selectedTPs.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTPs([])}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RefreshCw className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Menyiapkan data Tujuan Pembelajaran Kelas {selectedGrade}...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Menghubungkan standar kurikulum Kemendikdasmen
                </p>
              </div>
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((slmGroup, index) => {
              const allInGroupSelected =
                slmGroup.tp.length > 0 && slmGroup.tp.every((t) => selectedTPs.includes(t));

              return (
                <div
                  key={index}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/80">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full shrink-0" />
                      {slmGroup.slm}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAllInGroup(slmGroup.tp)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors"
                    >
                      {allInGroupSelected ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Batalkan Semua</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Pilih Semua Bab</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* TP Items */}
                  <div className="p-2 sm:p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {slmGroup.tp.map((tp, tpIndex) => {
                      const isChecked = selectedTPs.includes(tp);

                      return (
                        <label
                          key={tpIndex}
                          className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-slate-100"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(tp)}
                            className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <span className="text-xs sm:text-sm leading-relaxed">{tp}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery
                  ? "Tidak ada TP yang cocok dengan pencarian Anda."
                  : `Tidak ada data TP bawaan untuk "${subject?.label || subject?.fullName}" di Kelas ${selectedGrade}.`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                Anda dapat memilih jenjang kelas lain pada menu di atas, atau menambahkan Tujuan Pembelajaran secara mandiri melalui tombol "+ Tambah TP".
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGradeChange(selectedGrade)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Muat Ulang Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={selectedTPs.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
          >
            <span>+ Tambahkan {selectedTPs.length > 0 ? `${selectedTPs.length} TP Terpilih` : "Pilihan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
