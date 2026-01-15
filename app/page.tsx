"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Save, Calendar, BookOpen, CheckCircle, XCircle, AlertCircle, Edit2, Zap, Clock, Download, List, GraduationCap, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useSession, signIn, signOut } from "next-auth/react";
import { saveScheduleToDB, loadScheduleFromDB } from './actions';

// --- BRANDING ---
const BRAND = {
  name: "UniPlan Pro",
  logoColor: "text-blue-600",
  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  primaryLight: "bg-blue-50",
  primaryText: "text-blue-600",
  primaryBorder: "border-blue-200",
  secondary: "bg-slate-900",
  accent: "text-emerald-500",
  accentBg: "bg-emerald-50",
  accentBorder: "border-emerald-100",
};

const TIME_PRESETS = [
  { label: "Morning (09:00-12:00)", start: "09:00", end: "12:00" },
  { label: "Afternoon (13:30-16:30)", start: "13:30", end: "16:30" }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- TYPES ---
interface ClassSession { day: string; start: string; end: string; }
interface Subject { id: string; name: string; section: string; credits: number; noTime: boolean; classes: ClassSession[]; color: string; active: boolean; }
interface FormSection { id: number; section: string; noTime: boolean; classes: ClassSession[]; }

// --- UTILITIES ---
const timeToMin = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const PALETTE = [ "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500" ];

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + "00000".substring(0, 6 - c.length) + c;
};

// --- COMPONENTS ---

const TimeSlotGrid = ({ schedule, id, exporting }: { schedule: Subject[], id: string, exporting?: boolean }) => {
  const START_HOUR = 8;
  const END_HOUR = 20;
  const scheduledSubjects = schedule.filter(s => !s.noTime);
  const totalCredits = schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div 
        id={id} 
        className={`${exporting ? 'bg-white' : 'bg-white shadow-xl border border-slate-200'} mb-8 flex flex-col w-full transition-all duration-300`} 
        // Force explicit desktop width during export to ensure high res and full span
        style={exporting ? { width: '1920px', minWidth: '1920px', margin: 0, border: 'none' } : { }}
    >
      <div className={`${BRAND.secondary} text-white p-4 md:p-6 flex justify-between items-center border-b border-slate-800`}>
         <div><div className="font-black text-lg md:text-2xl tracking-widest flex items-center gap-3 uppercase"><GraduationCap size={28} className="text-white opacity-80"/> {BRAND.name}</div><div className="text-xs text-slate-400 mt-1">Generated Schedule</div></div>
         <div className="text-right"><div className={`text-xl md:text-3xl font-bold ${BRAND.accent}`}>{totalCredits} <span className="text-xs md:text-lg font-normal text-slate-400">Credits</span></div><div className="text-[10px] md:text-sm text-slate-400">{schedule.length} Subjects Selected</div></div>
      </div>
      
      {/* GRID SECTION */}
      <div className="w-full grid bg-slate-50 divide-x divide-slate-200 border-b border-slate-200 grid-cols-[30px_repeat(7,minmax(0,1fr))] sm:grid-cols-[50px_repeat(7,minmax(0,1fr))] lg:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className="p-1 sm:p-2 lg:p-4 border-b border-slate-200 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-400 text-center flex items-center justify-center">TIME</div>
        {DAYS.map(day => (<div key={day} className="p-1 sm:p-2 lg:p-4 border-b border-slate-200 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-600 text-center uppercase tracking-wider overflow-hidden"><span className="lg:hidden">{day.substring(0,3)}</span><span className="hidden lg:inline">{day}</span></div>))}
        <div className="relative border-r border-slate-200 bg-white" style={{ height: '700px' }}>
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full text-right pr-1 sm:pr-2 lg:pr-3 text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 font-medium transform -translate-y-1/2 border-t border-transparent" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}>{String(START_HOUR + i).padStart(2, '0')}:00</div>))}
        </div>
        {DAYS.map(day => (
          <div key={day} className="relative bg-white h-[700px] group transition-colors hover:bg-slate-50">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full border-t border-slate-100" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }} />))}
            {scheduledSubjects.map(subject => {
              const daysClasses = subject.classes.filter(c => c.day === day);
              return daysClasses.map((cls, idx) => {
                const startMin = timeToMin(cls.start);
                const endMin = timeToMin(cls.end);
                const topPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                const heightPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;
                return (
                  <div key={`${subject.id}-${idx}`} className={`absolute inset-x-0.5 sm:inset-x-1 rounded p-0.5 sm:p-1 lg:p-2 text-white shadow-sm z-10 flex flex-col justify-center items-center text-center overflow-hidden leading-tight ${subject.color}`} style={{ top: `${topPerc}%`, height: `${heightPerc}%`, minHeight: '35px' }}>
                    <span className="font-black text-[6px] sm:text-[8px] lg:text-[11px] uppercase w-full break-words leading-none mb-0.5" style={{wordBreak: 'break-word'}}>{subject.name}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[10px] opacity-90 font-medium leading-none">Sec {subject.section}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[9px] opacity-75 mt-0.5 hidden sm:block leading-none">{cls.start} - {cls.end}</span>
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>

      {/* DETAILS SECTION */}
      <div className="bg-white p-4 lg:p-8">
        <h3 className="font-bold text-slate-800 text-sm mb-4 lg:mb-6 flex items-center gap-2 uppercase tracking-wider border-b pb-4"><List size={20} className={BRAND.primaryText} /> Selected Subjects Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {schedule.map(subject => (
                <div key={subject.id} className="border border-slate-200 rounded-xl p-3 lg:p-4 flex items-start gap-3 lg:gap-4 bg-slate-50 break-inside-avoid">
                    <div className={`w-3 h-3 mt-1.5 rounded-full ${subject.color} flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-xs sm:text-sm break-words whitespace-normal leading-snug mb-2">{subject.name}</div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-2 lg:gap-3 items-center"><span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">Sec {subject.section}</span><span className={`font-bold ${BRAND.primaryText} whitespace-nowrap`}>{subject.credits} Credits</span></div>
                        {subject.noTime && <div className="text-[10px] lg:text-[11px] text-orange-600 mt-2 italic flex items-center gap-1"><Clock size={12}/> No scheduled time</div>}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

interface AddSubjectFormProps { onSave: (name: string, credits: number, sections: FormSection[]) => void; onCancel: () => void; initialName?: string; initialCredits?: number; initialSections?: Subject[]; }

const AddSubjectForm = ({ onSave, onCancel, initialName, initialCredits, initialSections }: AddSubjectFormProps) => {
  const [name, setName] = useState(initialName || '');
  const [credits, setCredits] = useState<number>(initialCredits !== undefined ? initialCredits : 3);
  const [sections, setSections] = useState<FormSection[]>(() => {
    if (initialSections && initialSections.length > 0) return initialSections.map((s, idx) => ({ id: Date.now() + idx, section: s.section, noTime: s.noTime || false, classes: s.classes }));
    return [{ id: Date.now(), section: '1', noTime: false, classes: [{ day: 'Monday', start: '09:00', end: '12:00' }] }];
  });

  const isSuspiciousTime = (time: string) => { const [h] = time.split(':').map(Number); return h >= 1 && h < 7; };
  const addSection = () => setSections([...sections, { id: Date.now() + Math.random(), section: '', noTime: false, classes: [{ day: 'Monday', start: '09:00', end: '12:00' }] }]);
  const updateSection = (id: number, field: keyof FormSection, value: any) => setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  const updateClass = (sectionId: number, classIndex: number, field: keyof ClassSession, value: string) => setSections(sections.map(s => { if (s.id !== sectionId) return s; const newClasses = [...s.classes]; newClasses[classIndex] = { ...newClasses[classIndex], [field]: value }; return { ...s, classes: newClasses }; }));
  const applyPreset = (sectionId: number, classIndex: number, start: string, end: string) => setSections(sections.map(s => { if (s.id !== sectionId) return s; const newClasses = [...s.classes]; newClasses[classIndex] = { ...newClasses[classIndex], start, end }; return { ...s, classes: newClasses }; }));
  const addClassSlot = (sectionId: number) => setSections(sections.map(s => { if (s.id !== sectionId) return s; return { ...s, classes: [...s.classes, { day: 'Wednesday', start: '13:30', end: '16:30' }] }; }));
  const removeClassSlot = (sectionId: number, idx: number) => setSections(sections.map(s => { if (s.id !== sectionId) return s; return { ...s, classes: s.classes.filter((_, i) => i !== idx) }; }));
  const removeSection = (id: number) => { if (sections.length > 1) setSections(sections.filter(s => s.id !== id)); };
  const handleSave = () => { if (!name) return alert("Please enter a subject name"); onSave(name, isNaN(Number(credits)) ? 0 : Number(credits), sections); };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 mb-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-slate-800">{initialName ? 'Edit Subject Options' : 'Add New Subject'}</h2><button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><XCircle size={20}/></button></div>
      <div className={`${BRAND.primaryLight} ${BRAND.primaryText} px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 border ${BRAND.primaryBorder}`}><AlertCircle size={16} /><span>Reminder: Use 13:30 for 1:30 PM</span></div>
      <div className="space-y-6">
        <div className="grid grid-cols-[3fr_1fr] gap-4">
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject Name</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Data Structures" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Credits</label><input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" value={credits} onChange={e => setCredits(e.target.valueAsNumber || 0)} /></div>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {sections.map((sec, sIdx) => (
            <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
              <div className="absolute top-2 right-2">{sections.length > 1 && (<button onClick={() => removeSection(sec.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>)}</div>
              <div className="flex gap-4 items-center mb-4"><span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">OPTION {sIdx + 1}</span><input placeholder="Sec ID" className="bg-transparent border-b border-slate-300 font-bold w-24 focus:border-indigo-500 outline-none text-sm" value={sec.section} onChange={e => updateSection(sec.id, 'section', e.target.value)} /><label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer select-none border-l pl-4 border-slate-300"><input type="checkbox" checked={sec.noTime} onChange={e => updateSection(sec.id, 'noTime', e.target.checked)} className={`rounded ${BRAND.primaryText}`}/>No Scheduled Time</label></div>
              {!sec.noTime ? (
                <div className="space-y-4">
                  {sec.classes.map((cls, cIdx) => (
                    <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-1"><span className="text-[10px] font-bold text-slate-400 uppercase self-center mr-1 flex gap-1"><Zap size={12}/> Quick:</span>{TIME_PRESETS.map((preset) => (<button key={preset.label} onClick={() => applyPreset(sec.id, cIdx, preset.start, preset.end)} className="px-3 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 text-[10px] font-bold rounded-full transition-colors whitespace-nowrap">{preset.label}</button>))}</div>
                      <div className="flex gap-2 items-center"><select className="p-2 rounded-lg text-xs border border-slate-200 bg-white" value={cls.day} onChange={e => updateClass(sec.id, cIdx, 'day', e.target.value)}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select><div className="relative"><input type="time" className={`p-2 rounded-lg text-xs border bg-white ${isSuspiciousTime(cls.start) ? 'border-red-400 text-red-500 font-bold' : 'border-slate-200'}`} value={cls.start} onChange={e => updateClass(sec.id, cIdx, 'start', e.target.value)} /></div><span className="text-slate-400">-</span><input type="time" className="p-2 rounded-lg text-xs border border-slate-200 bg-white" value={cls.end} onChange={e => updateClass(sec.id, cIdx, 'end', e.target.value)} />{sec.classes.length > 1 && <button onClick={() => removeClassSlot(sec.id, cIdx)} className="text-red-400 hover:bg-red-50 p-1 rounded"><XCircle size={14} /></button>}</div>
                      {isSuspiciousTime(cls.start) && <div className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">⚠️ That is {cls.start} AM.</div>}
                    </div>
                  ))}
                  <button onClick={() => addClassSlot(sec.id)} className={`text-[10px] ${BRAND.primaryText} font-bold hover:underline ml-2`}>+ Add another day</button>
                </div>
              ) : (<div className={`p-4 ${BRAND.primaryLight} rounded-xl ${BRAND.primaryText} text-xs font-bold text-center border ${BRAND.primaryBorder} flex flex-col items-center gap-2`}><Clock size={20} className="opacity-50"/>No scheduled time.</div>)}
            </div>
          ))}
        </div>
        <div className="flex gap-3"><button onClick={addSection} className="flex-1 py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl font-bold hover:border-indigo-400 hover:text-indigo-500 transition-colors">Add Option</button><button onClick={handleSave} className={`flex-1 py-3 ${BRAND.primary} ${BRAND.primaryHover} text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95`}><Save size={18} /> Save Subject</button></div>
      </div>
    </div>
  );
};

export default function Home() {
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function initData() {
      if (status === 'authenticated') {
        try {
          const dbData = await loadScheduleFromDB();
          if (dbData && Array.isArray(dbData)) setSubjects(dbData);
          else setSubjects([]); 
        } catch (e) { console.error("DB Load Error", e); }
      } else if (status === 'unauthenticated') {
        const saved = localStorage.getItem('next-scheduler-prod-v1');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const migrated = parsed.map((s: any) => ({ ...s, credits: typeof s.credits === 'number' ? s.credits : 3, noTime: s.noTime ?? false }));
            setSubjects(migrated);
          } catch (e) { console.error(e); }
        }
      }
      setIsLoaded(true);
    }
    initData();
  }, [status]);

  const persistData = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    if (status === 'authenticated') {
      setSaving(true);
      try { await saveScheduleToDB(newSubjects); } catch (e) { console.error("Failed to save", e); alert("Failed to save"); }
      setSaving(false);
    } else { localStorage.setItem('next-scheduler-prod-v1', JSON.stringify(newSubjects)); }
  };

  const toggleSection = (id: string) => persistData(subjects.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const toggleSubjectGroup = (name: string, shouldActive: boolean) => persistData(subjects.map(s => s.name === name ? { ...s, active: shouldActive } : s));
  const deleteSubjectGroup = (name: string) => { if (window.confirm(`Delete ${name}?`)) persistData(subjects.filter(s => s.name !== name)); };
  
  const handleSaveSubject = (name: string, credits: number, sections: FormSection[]) => {
    const nameToRemove = editingName || name;
    let otherSubjects = subjects.filter(s => s.name !== nameToRemove);
    const existingColorSubject = subjects.find(s => s.name === nameToRemove);
    let colorToUse = existingColorSubject?.color || PALETTE[new Set(otherSubjects.map(s => s.name)).size % PALETTE.length];
    
    const newEntries: Subject[] = sections.map(sec => ({ id: Math.random().toString(36).substr(2, 9), name: name, section: sec.section, credits: credits, noTime: sec.noTime, classes: sec.classes, color: colorToUse!, active: true }));
    persistData([...otherSubjects, ...newEntries]);
    setShowAddForm(false);
    setEditingName(null);
  };

  const groupedSubjects = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    subjects.forEach(s => { (groups[s.name] = groups[s.name] || []).push(s); });
    return groups;
  }, [subjects]);

  const generatedSchedules = useMemo(() => {
    if (!isLoaded) return [];
    const activeSubjects = subjects.filter(s => s.active);
    if (activeSubjects.length === 0) return [];
    const grouped: Record<string, Subject[]> = activeSubjects.reduce((acc, s) => { (acc[s.name] = acc[s.name] || []).push(s); return acc; }, {} as Record<string, Subject[]>);
    const names = Object.keys(grouped);
    const results: Subject[][] = [];
    const isOverlapping = (c1: ClassSession, c2: ClassSession) => { if (c1.day !== c2.day) return false; return Math.max(timeToMin(c1.start), timeToMin(c2.start)) < Math.min(timeToMin(c1.end), timeToMin(c2.end)); };
    const hasConflict = (schedule: Subject[], newSubject: Subject) => { if (newSubject.noTime) return false; for (let existing of schedule) { if (existing.noTime) continue; for (let c1 of existing.classes) { for (let c2 of newSubject.classes) { if (isOverlapping(c1, c2)) return true; } } } return false; };
    const buildSchedule = (index: number, currentSchedule: Subject[]) => { if (results.length >= 50) return; if (index === names.length) { results.push(currentSchedule); return; } const subjectName = names[index]; const sections = grouped[subjectName]; for (let section of sections) { if (!hasConflict(currentSchedule, section)) { buildSchedule(index + 1, [...currentSchedule, section]); } } };
    buildSchedule(0, []);
    return results;
  }, [subjects, isLoaded]);

  const calculateCredits = (schedule: Subject[]) => schedule.reduce((sum, s) => sum + (s.credits || 0), 0);
  const calculateTotalActiveCredits = () => { const activeNames = new Set(); let total = 0; subjects.filter(s => s.active).forEach(s => { if (!activeNames.has(s.name)) { total += (s.credits || 0); activeNames.add(s.name); } }); return total; };

  // --- UPDATED EXPORT LOGIC FOR PIXEL-PERFECT PDF ---
  const downloadPDF = async (index: number) => {
    const id = `schedule-option-${index}`;
    setExportingId(id);
    
    // Allow React 100ms to render the 1920px version
    setTimeout(async () => {
        const element = document.getElementById(id);
        if (element) {
            try {
                // Capture at 2x ratio for high DPI quality
                const dataUrl = await toPng(element, { 
                    cacheBust: true, 
                    pixelRatio: 2, 
                    backgroundColor: '#ffffff',
                    // Explicitly tell toPng the full dimensions we expect
                    width: 1920,
                    height: element.offsetHeight // Ensure full height is captured
                });
                
                // Create PDF where 1px = 1 unit. 
                // This bypasses A4 logic completely and creates a custom page size.
                // The page is exactly the size of your image.
                const imgProps = new jsPDF().getImageProperties(dataUrl);
                const pdfWidth = imgProps.width;
                const pdfHeight = imgProps.height;
                
                const pdf = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'l' : 'p',
                    unit: 'px',
                    format: [pdfWidth, pdfHeight]
                });
                
                // Add image at 0,0 filling the whole custom page
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`my-schedule-option-${index + 1}.pdf`);
            } catch (err) { 
                console.error("Export failed", err); 
                alert("Failed to export PDF."); 
            }
        }
        setExportingId(null);
    }, 100);
  };

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div><h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><GraduationCap className={BRAND.logoColor} size={32} /> {BRAND.name}</h1></div>
          <div className="flex gap-3 items-center">
             {status === 'authenticated' ? (<div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-slate-200">{session.user?.image ? (<img src={session.user.image} alt="User" className="w-8 h-8 rounded-full" />) : (<div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: stringToColor(session.user?.name || 'User') }}>{(session.user?.name?.[0] || 'U').toUpperCase()}</div>)}<div className="text-xs text-left"><div className="font-bold text-slate-700">{session.user?.name}</div><div className="text-slate-400 text-[10px]">Cloud Sync Active {saving && '...'}</div></div><button onClick={() => signOut()} className="text-slate-400 hover:text-red-500 ml-2"><LogOut size={16}/></button></div>) : (<button onClick={() => signIn('google')} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2"><LogIn size={16}/> Login to Sync</button>)}
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <button onClick={() => { setEditingName(null); setShowAddForm(!showAddForm); }} className={`${BRAND.primary} ${BRAND.primaryHover} text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2`}><Plus size={18} /> Add Subject</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-[400px] flex-shrink-0 space-y-6">
            {showAddForm ? (<AddSubjectForm onSave={handleSaveSubject} onCancel={() => { setShowAddForm(false); setEditingName(null); }} initialName={editingName || undefined} initialCredits={editingName ? subjects.find(s => s.name === editingName)?.credits : undefined} initialSections={editingName ? subjects.filter(s => s.name === editingName) : undefined} />) : (
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm uppercase text-slate-400">Library</h3><button onClick={() => {if(window.confirm('Clear all?')) persistData([])}} className="text-xs text-red-400">Reset</button></div>
                {Object.keys(groupedSubjects).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Library is empty.<br/>{status === 'unauthenticated' && 'Login to load your saved schedule.'}</div>}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(groupedSubjects).map(([name, group]) => {
                    const allActive = group.every(s => s.active);
                    const someActive = group.some(s => s.active);
                    const color = group[0].color;
                    const credits = group[0].credits || 0;
                    return (
                      <div key={name} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                        <div className="bg-white p-3 border-b border-slate-100 flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${someActive ? `${BRAND.primary} border-transparent` : 'border-slate-300'}`} onClick={() => toggleSubjectGroup(name, !allActive)}>{someActive && <CheckCircle size={10} className="text-white" />}</div>
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <div className="flex-1 font-bold text-sm text-slate-700">{name} <span className="text-slate-400 font-normal text-xs ml-1">({credits} Cr)</span></div>
                          <div className="flex gap-1"><button onClick={() => handleEdit(name)} className={`p-1 text-slate-300 ${BRAND.primaryHover} hover:text-white rounded`}><Edit2 size={14} /></button><button onClick={() => deleteSubjectGroup(name)} className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={14} /></button></div>
                        </div>
                        <div className="bg-slate-50 p-2 space-y-1">
                          {group.map(s => (<div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl text-xs ${s.active ? 'bg-white shadow-sm text-slate-700' : 'opacity-50 text-slate-400'}`}><input type="checkbox" checked={s.active} onChange={() => toggleSection(s.id)} className={`rounded ${BRAND.primaryText} cursor-pointer`}/><span className="font-mono font-bold bg-slate-100 px-1 rounded text-[10px]">SEC {s.section}</span><div className="flex-1 text-[10px]">{s.noTime ? <span className="italic text-slate-500">No fixed time</span> : s.classes.map((c, i) => (<span key={i} className="mr-2">{c.day.slice(0,3)} {c.start}</span>))}</div></div>))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className={`${BRAND.secondary} text-white p-6 rounded-3xl shadow-xl`}>
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BookOpen size={18}/> Summary</h3>
               <div className="flex justify-between items-center mb-2"><span className="text-slate-400 text-sm">Active Subjects</span><span className="text-white font-bold">{Object.values(groupedSubjects).filter(g => g.some(s => s.active)).length}</span></div>
               <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-sm">Valid Schedules</span><div className="px-2 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2"><CheckCircle size={12} className={BRAND.accent}/> {generatedSchedules.length} Options</div></div>
               <div className="flex justify-between items-center pt-2 border-t border-slate-800"><span className="text-slate-400 text-sm">Total Credits (Possible)</span><span className={`${BRAND.accent} font-black text-xl`}>{calculateTotalActiveCredits()}</span></div>
            </div>
          </div>

          <div className="w-full flex-1 min-w-0 space-y-12">
            {generatedSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200"><AlertCircle size={48} className="text-slate-300 mb-4" /><h3 className="text-xl font-bold text-slate-400">No Schedules</h3></div>
            ) : (
              generatedSchedules.map((schedule, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-4 ml-4">
                      <div className={`${BRAND.secondary} text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg`}>Option #{idx + 1}</div>
                      <div className={`text-xs font-bold ${BRAND.accent} ${BRAND.accentBg} px-3 py-1 rounded-full border ${BRAND.accentBorder}`}>{calculateCredits(schedule)} Credits</div>
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <button onClick={() => downloadPDF(idx)} disabled={exportingId !== null} className={`bg-white border border-slate-200 hover:border-${BRAND.primary.replace('bg-', '')} text-slate-500 ${BRAND.primaryText.replace('text-', 'hover:text-')} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50`}><Download size={14}/> {exportingId === `schedule-option-${idx}` ? 'Saving...' : 'PDF'}</button>
                  </div>
                  <TimeSlotGrid schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}