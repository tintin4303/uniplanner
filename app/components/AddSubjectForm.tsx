import React, { useState } from 'react';
import { XCircle, AlertCircle, Zap, Save, Trash2, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../context/ToastContext';
import { BRAND, TIME_PRESETS, DAYS } from '@/app/lib/constants';
import { Subject, FormSection, ClassSession } from '@/app/lib/types';

interface AddSubjectFormProps {
  onSave: (name: string, credits: number, sections: FormSection[]) => void;
  onCancel: () => void;
  initialName?: string;
  initialCredits?: number;
  initialSections?: Subject[];
}

export default function AddSubjectForm({ onSave, onCancel, initialName, initialCredits, initialSections }: AddSubjectFormProps) {
  const [name, setName] = useState(initialName || '');
  const [credits, setCredits] = useState<number>(initialCredits !== undefined ? initialCredits : 3);
  const { addToast } = useToast();

  // Transform Subject[] back to FormSection[] for editing, or default for new
  const [sections, setSections] = useState<FormSection[]>(() => {
    if (initialSections && initialSections.length > 0) {
      return initialSections.map((s, idx) => ({
        id: Date.now() + idx,
        section: s.section,
        noTime: s.noTime || false,
        classes: s.classes
      }));
    }
    return [{ id: Date.now(), section: '1', noTime: false, classes: [{ day: 'Monday', start: '09:00', end: '12:00' }] }];
  });

  const isSuspiciousTime = (time: string) => {
    const [h] = time.split(':').map(Number);
    return h >= 1 && h < 7;
  };

  const addSection = () => setSections([...sections, { id: Date.now() + Math.random(), section: '', noTime: false, classes: [{ day: 'Monday', start: '09:00', end: '12:00' }] }]);

  const updateSection = (id: number, field: keyof FormSection, value: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateClass = (sectionId: number, classIndex: number, field: keyof ClassSession, value: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      const newClasses = [...s.classes];
      newClasses[classIndex] = { ...newClasses[classIndex], [field]: value };
      return { ...s, classes: newClasses };
    }));
  };

  const applyPreset = (sectionId: number, classIndex: number, start: string, end: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      const newClasses = [...s.classes];
      newClasses[classIndex] = { ...newClasses[classIndex], start, end };
      return { ...s, classes: newClasses };
    }));
  };

  const addClassSlot = (sectionId: number) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, classes: [...s.classes, { day: 'Wednesday', start: '13:30', end: '16:30' }] };
    }));
  };

  const removeClassSlot = (sectionId: number, idx: number) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, classes: s.classes.filter((_, i) => i !== idx) };
    }));
  };

  const removeSection = (id: number) => {
    if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
  };

  const handleSubmit = () => {
    if (!name) {
      addToast("Please enter a subject name", 'error');
      return;
    }
    onSave(name, isNaN(Number(credits)) ? 0 : Number(credits), sections);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6 animate-in fade-in zoom-in-95 duration-200 ease-out">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">{initialName ? 'Edit Subject' : 'Add New Subject'}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><XCircle size={20} /></button>
      </div>

      <div className={`${BRAND.primaryLight} ${BRAND.primaryText} px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 border ${BRAND.primaryBorder}`}>
        <AlertCircle size={16} /><span>Reminder: Use 13:30 for 1:30 PM</span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-[3fr_1fr] gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Subject Name</label>
            <input className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. Data Structures" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Credits</label>
            <input type="number" min="0" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" value={credits} onChange={e => setCredits(e.target.valueAsNumber || 0)} />
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {sections.map((sec, sIdx) => (
            <div key={sec.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl relative group animate-in slide-in-from-left-2 duration-300">
              <div className="absolute top-2 right-2">
                {sections.length > 1 && (<button onClick={() => removeSection(sec.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"><Trash2 size={14} /></button>)}
              </div>
              <div className="flex gap-4 items-center mb-4">
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold">OPTION {sIdx + 1}</span>
                <input placeholder="Sec ID" className="bg-transparent border-b border-slate-300 dark:border-slate-600 font-bold w-24 focus:border-indigo-500 outline-none text-sm transition-colors text-slate-800 dark:text-slate-200" value={sec.section} onChange={e => updateSection(sec.id, 'section', e.target.value)} />
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none border-l pl-4 border-slate-300 dark:border-slate-600">
                  <input type="checkbox" checked={sec.noTime} onChange={e => updateSection(sec.id, 'noTime', e.target.checked)} className={`rounded ${BRAND.primaryText} cursor-pointer`} /> No Scheduled Time
                </label>
              </div>
              {!sec.noTime ? (
                <div className="space-y-4">
                  {sec.classes.map((cls, cIdx) => (
                    <div key={cIdx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase self-center mr-1 flex gap-1"><Zap size={12} /> Quick:</span>
                        {TIME_PRESETS.map((preset) => (
                          <button key={preset.label} onClick={() => applyPreset(sec.id, cIdx, preset.start, preset.end)} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 text-[10px] font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer">{preset.label}</button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <select className="p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 min-w-[120px]" value={cls.day} onChange={e => updateClass(sec.id, cIdx, 'day', e.target.value)}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        <div className="flex gap-2 items-center">
                          <input type="time" className={`p-2 rounded-lg text-xs border bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 w-[110px] min-w-0 ${isSuspiciousTime(cls.start) ? 'border-red-400 text-red-500 font-bold' : 'border-slate-200 dark:border-slate-700'}`} value={cls.start} onChange={e => updateClass(sec.id, cIdx, 'start', e.target.value)} />
                          <span className="text-slate-400 shrink-0">-</span>
                          <input type="time" className="p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 w-[110px] min-w-0" value={cls.end} onChange={e => updateClass(sec.id, cIdx, 'end', e.target.value)} />
                        </div>
                        {sec.classes.length > 1 && <button onClick={() => removeClassSlot(sec.id, cIdx)} className="text-red-400 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"><XCircle size={14} /></button>}
                      </div>
                      {isSuspiciousTime(cls.start) && <div className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">⚠️ That is {cls.start} AM.</div>}
                    </div>
                  ))}
                  <button onClick={() => addClassSlot(sec.id)} className={`text-[10px] ${BRAND.primaryText} font-bold hover:underline ml-2 cursor-pointer`}>+ Add another day</button>
                </div>
              ) : (<div className={`p-4 ${BRAND.primaryLight} rounded-xl ${BRAND.primaryText} text-xs font-bold text-center border ${BRAND.primaryBorder} flex flex-col items-center gap-2`}><Clock size={20} className="opacity-50" />No scheduled time.</div>)}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={addSection} className="flex-1 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-xl font-bold hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer">Add Option</button>
          <button onClick={handleSubmit} className={`flex-1 py-3 ${BRAND.primary} ${BRAND.primaryHover} text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer`}><Save size={18} /> Save Subject</button>
        </div>
      </div>
    </div>
  );
}