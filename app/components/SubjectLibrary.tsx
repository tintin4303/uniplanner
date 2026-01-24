import React, { useMemo } from 'react';
import { CheckCircle, Edit2, Trash2, BookOpen, Plus } from 'lucide-react';
import { BRAND } from '@/app/lib/constants';
import { Subject } from '@/app/lib/types';

interface LibraryProps {
  subjects: Subject[];
  onToggleGroup: (name: string, isActive: boolean) => void;
  onToggleSection: (id: string) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onReset: () => void;
  onAddSubject: () => void;
  theme: any;
  validSchedulesCount: number;
}

export default function SubjectLibrary({ subjects, onToggleGroup, onToggleSection, onEdit, onDelete, onReset, onAddSubject, theme, validSchedulesCount }: LibraryProps) {

  const groupedSubjects = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    subjects.forEach(s => { (groups[s.name] = groups[s.name] || []).push(s); });
    return groups;
  }, [subjects]);

  const totalActiveCredits = useMemo(() => {
    const activeNames = new Set();
    let total = 0;
    subjects.filter(s => s.active).forEach(s => {
      if (!activeNames.has(s.name)) {
        total += (s.credits || 0);
        activeNames.add(s.name);
      }
    });
    return total;
  }, [subjects]);

  const activeSubjectsCount = Object.values(groupedSubjects).filter(g => g.some(s => s.active)).length;

  return (
    <>
      {/* LIBRARY LIST */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold text-sm uppercase opacity-50 text-slate-800 dark:text-slate-200`}>Library</h3>
          <div className="flex items-center gap-2">
            <button onClick={onAddSubject} className={`${BRAND.primary} ${BRAND.primaryHover} text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer`}>
              <Plus size={14} /> Add Subject
            </button>
            <button onClick={onReset} className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer">Reset</button>
          </div>
        </div>

        {Object.keys(groupedSubjects).length === 0 && <div className="text-center py-10 opacity-50 text-sm text-slate-500 dark:text-slate-400">Library is empty.</div>}

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(groupedSubjects).map(([name, group]) => {
            const allActive = group.every(s => s.active);
            const someActive = group.some(s => s.active);
            const subjectIndex = Object.keys(groupedSubjects).indexOf(name);
            const themeColor = theme.colors.subjectPalette[subjectIndex % theme.colors.subjectPalette.length];
            const credits = group[0].credits || 0;

            return (
              <div key={name} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50 transition-all hover:shadow-sm">
                <div className="bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${someActive ? `${BRAND.primary} border-transparent` : 'border-slate-300 dark:border-slate-500'}`} onClick={() => onToggleGroup(name, !allActive)}>
                    {someActive && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${themeColor}`}></div>
                  <div className="flex-1 font-bold text-sm opacity-80 text-slate-800 dark:text-slate-100">{name} <span className="opacity-50 font-normal text-xs ml-1">({credits} Cr)</span></div>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(name)} className={`p-1 opacity-50 hover:opacity-100 transition-colors cursor-pointer text-slate-600 dark:text-slate-300`}><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(name)} className="p-1 opacity-50 hover:text-red-500 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {group.map(s => (
                    <div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl text-xs ${s.active ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'} transition-all`}>
                      <input type="checkbox" checked={s.active} onChange={() => onToggleSection(s.id)} className={`rounded ${BRAND.primaryText} cursor-pointer`} />
                      <span className="font-mono font-bold bg-black/10 dark:bg-white/10 px-1 rounded text-[10px] text-slate-700 dark:text-slate-300">SEC {s.section}</span>
                      <div className="flex-1 text-[10px] text-slate-700 dark:text-slate-300">
                        {s.noTime ? <span className="italic opacity-50">No fixed time</span> : s.classes.map((c, i) => (<span key={i} className="mr-2">{c.day.slice(0, 3)} {c.start}</span>))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className={`${theme.colors.header} ${theme.colors.headerText} p-6 rounded-3xl shadow-xl mt-6`}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><BookOpen size={18} /> Summary</h3>
        <div className="flex justify-between items-center mb-2"><span className="text-white opacity-80 text-sm">Active Subjects</span><span className="font-bold text-white">{activeSubjectsCount}</span></div>
        <div className="flex justify-between items-center mb-4"><span className="text-white opacity-80 text-sm">Valid Schedules</span><div className="px-2 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 text-white"><CheckCircle size={12} className="text-white" /> {validSchedulesCount} Options</div></div>
        <div className="flex justify-between items-center pt-2 border-t border-white/20"><span className="text-white opacity-80 text-sm">Total Credits</span><span className="text-white font-black text-xl">{totalActiveCredits}</span></div>
      </div>
    </>
  );
}