// app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Save, BookOpen, CheckCircle, XCircle, AlertCircle, Edit2, Zap, Clock, Download, List, GraduationCap, LogIn, LogOut, Gem, PlayCircle, CreditCard, Sparkles, ExternalLink, Sun, Coffee, Moon, Heart } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useSession, signIn, signOut } from "next-auth/react";
import { saveScheduleToDB, loadScheduleFromDB, getUserTokens, rewardTokens, generateAiAction } from './actions';
import Image from "next/image"; // <--- 1. IMPORT NEXT IMAGE

// --- CONFIG ---
const BRAND = {
  name: "UniPlanner",
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

const AD_URL = process.env.NEXT_PUBLIC_ADSTERRA_URL || "#";
const CACHE_KEY = 'uniplan-local-cache-v1';

const TIME_PRESETS = [
  { label: "Morning (09:00-12:00)", start: "09:00", end: "12:00" },
  { label: "Afternoon (13:30-16:30)", start: "13:30", end: "16:30" }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PALETTE = [ "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500" ];

// --- UTILITIES ---
const timeToMin = (time: string): number => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const minToTime = (min: number) => { const h = Math.floor(min / 60); const m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
const stringToColor = (str: string) => { let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); const c = (hash & 0x00FFFFFF).toString(16).toUpperCase(); return '#' + "00000".substring(0, 6 - c.length) + c; };

// --- TYPES ---
interface ClassSession { day: string; start: string; end: string; }
interface Subject { id: string; name: string; section: string; credits: number; noTime: boolean; classes: ClassSession[]; color: string; active: boolean; }
interface FormSection { id: number; section: string; noTime: boolean; classes: ClassSession[]; }

// --- SCHEDULE SUMMARIZER ALGORITHM ---
const analyzeSchedule = (schedule: Subject[]) => {
    const tags: { icon: any, text: string, color: string }[] = [];
    const activeDays = new Set<string>();
    let earliestStart = 24 * 60;
    let latestEnd = 0;
    
    const daySchedules: Record<string, { start: number, end: number }[]> = {};

    schedule.forEach(sub => {
        if (sub.noTime) return;
        sub.classes.forEach(cls => {
            activeDays.add(cls.day);
            const s = timeToMin(cls.start);
            const e = timeToMin(cls.end);
            if (s < earliestStart) earliestStart = s;
            if (e > latestEnd) latestEnd = e;

            if (!daySchedules[cls.day]) daySchedules[cls.day] = [];
            daySchedules[cls.day].push({ start: s, end: e });
        });
    });

    const workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const freeDays = workDays.filter(d => !activeDays.has(d));
    if (freeDays.length > 0) {
        if (freeDays.length <= 2) {
             freeDays.forEach(day => {
                 tags.push({ icon: Sun, text: `${day} Off`, color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
             });
        } else {
             tags.push({ icon: Sun, text: `${freeDays.length} Days Off!`, color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
        }
    }

    if (earliestStart >= 600) { 
        tags.push({ icon: Moon, text: "Sleep In (10am+)", color: "bg-indigo-100 text-indigo-700 border-indigo-200" });
    }

    if (latestEnd <= 840 && latestEnd > 0) { 
        tags.push({ icon: Zap, text: "Done by 2pm", color: "bg-amber-100 text-amber-700 border-amber-200" });
    }

    let blockedLunchDays = 0;
    const lunchStart = 12 * 60; 
    const lunchEnd = 13 * 60;

    Object.values(daySchedules).forEach(classes => {
        const isBusyAtLunch = classes.some(c => 
            (c.start <= lunchStart && c.end >= lunchEnd) || 
            (c.start > lunchStart && c.start < lunchEnd) || 
            (c.end > lunchStart && c.end < lunchEnd)        
        );
        if (isBusyAtLunch) blockedLunchDays++;
    });

    if (blockedLunchDays === 0 && activeDays.size > 0) {
        tags.push({ icon: Coffee, text: "Lunch Free", color: "bg-orange-100 text-orange-700 border-orange-200" });
    }

    return tags;
};

// --- COMPONENTS ---

// 1. AD OVERLAY COMPONENT
const AdOverlay = ({ onClose, onClaim }: { onClose: () => void, onClaim: () => void }) => {
    const [step, setStep] = useState<'intro' | 'timer' | 'claim'>('intro');
    const [timeLeft, setTimeLeft] = useState(15);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'timer') {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setStep('claim');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleStartAd = () => {
        window.open(AD_URL, '_blank');
        setStep('timer');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300 ease-out">
                {step !== 'timer' && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
                        <XCircle size={24} />
                    </button>
                )}

                {step === 'intro' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Gem size={40} className="text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Watch Ad to Earn</h2>
                        <p className="text-slate-500">Visit our sponsor for 15 seconds to recharge <strong>+5 Tokens</strong>.</p>
                        <button onClick={handleStartAd} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-xl">
                            <ExternalLink size={20} /> Visit Sponsor
                        </button>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Adsterra Secured</p>
                    </div>
                )}

                {step === 'timer' && (
                    <div className="space-y-6 py-8 animate-in fade-in duration-500">
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#4f46e5" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * timeLeft) / 15} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                            </svg>
                            <span className="text-3xl font-black text-indigo-600">{timeLeft}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700">Verifying...</h2>
                        <p className="text-sm text-slate-500">Please keep the ad tab open.</p>
                    </div>
                )}

                {step === 'claim' && (
                    <div className="space-y-6 animate-in zoom-in-75 duration-300">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Reward Unlocked!</h2>
                        <button onClick={onClaim} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg animate-pulse transition-all active:scale-95">
                            Claim +5 Tokens
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// 2. DONATION MODAL (QR Code)
const DonationModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300 ease-out">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
                    <XCircle size={24} />
                </button>
                
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Heart size={32} className="text-yellow-500 fill-yellow-500" />
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2">Buy me a Coffee</h2>
                <p className="text-slate-500 text-sm mb-6">Scan with any Thai Banking App to support the developer directly!</p>
                
                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner mb-6 inline-block hover:scale-105 transition-transform duration-300">
                    {/* 2. OPTIMIZED NEXT IMAGE FOR QR */}
                    <Image 
                        src="/qrcode.jpeg" 
                        alt="PromptPay QR" 
                        width={192} 
                        height={192} 
                        className="object-contain mx-auto mix-blend-multiply" 
                    />
                </div>

                <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors">
                    Close
                </button>
                <p className="text-[10px] text-slate-400 mt-4">PromptPay / Thai QR Payment</p>
            </div>
        </div>
    );
};

const TimeSlotGrid = ({ schedule, id, exporting }: { schedule: Subject[], id: string, exporting?: boolean }) => {
  const START_HOUR = 8;
  const END_HOUR = 20;
  const scheduledSubjects = schedule.filter(s => !s.noTime);
  const totalCredits = schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div id={id} className={`${exporting ? 'bg-white' : 'bg-white shadow-xl border border-slate-200'} mb-8 flex flex-col w-full transition-all duration-300`} style={exporting ? { width: '1920px', minWidth: '1920px', margin: 0, border: 'none' } : { }}>
      <div className={`${BRAND.secondary} text-white p-4 md:p-6 flex justify-between items-center border-b border-slate-800`}>
         <div><div className="font-black text-lg md:text-2xl tracking-widest flex items-center gap-3 uppercase"><GraduationCap size={28} className="text-white opacity-80"/> {BRAND.name}</div><div className="text-xs text-slate-400 mt-1">Generated Schedule</div></div>
         <div className="text-right"><div className={`text-xl md:text-3xl font-bold ${BRAND.accent}`}>{totalCredits} <span className="text-xs md:text-lg font-normal text-slate-400">Credits</span></div><div className="text-[10px] md:text-sm text-slate-400">{schedule.length} Subjects Selected</div></div>
      </div>
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
                  <div key={`${subject.id}-${idx}`} className={`absolute inset-x-0.5 sm:inset-x-1 rounded p-0.5 sm:p-1 lg:p-2 text-white shadow-sm z-10 flex flex-col justify-center items-center text-center overflow-hidden leading-tight ${subject.color} hover:scale-[1.02] transition-transform`} style={{ top: `${topPerc}%`, height: `${heightPerc}%`, minHeight: '35px' }}>
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
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 mb-6 animate-in fade-in zoom-in-95 duration-200 ease-out">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-slate-800">{initialName ? 'Edit Subject Options' : 'Add New Subject'}</h2><button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><XCircle size={20}/></button></div>
      <div className={`${BRAND.primaryLight} ${BRAND.primaryText} px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 border ${BRAND.primaryBorder}`}><AlertCircle size={16} /><span>Reminder: Use 13:30 for 1:30 PM</span></div>
      <div className="space-y-6">
        <div className="grid grid-cols-[3fr_1fr] gap-4">
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject Name</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. Data Structures" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Credits</label><input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" value={credits} onChange={e => setCredits(e.target.valueAsNumber || 0)} /></div>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {sections.map((sec, sIdx) => (
            <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group animate-in slide-in-from-left-2 duration-300">
              <div className="absolute top-2 right-2">{sections.length > 1 && (<button onClick={() => removeSection(sec.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={14}/></button>)}</div>
              <div className="flex gap-4 items-center mb-4"><span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">OPTION {sIdx + 1}</span><input placeholder="Sec ID" className="bg-transparent border-b border-slate-300 font-bold w-24 focus:border-indigo-500 outline-none text-sm transition-colors" value={sec.section} onChange={e => updateSection(sec.id, 'section', e.target.value)} /><label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer select-none border-l pl-4 border-slate-300"><input type="checkbox" checked={sec.noTime} onChange={e => updateSection(sec.id, 'noTime', e.target.checked)} className={`rounded ${BRAND.primaryText}`}/>No Scheduled Time</label></div>
              {!sec.noTime ? (
                <div className="space-y-4">
                  {sec.classes.map((cls, cIdx) => (
                    <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-1"><span className="text-[10px] font-bold text-slate-400 uppercase self-center mr-1 flex gap-1"><Zap size={12}/> Quick:</span>{TIME_PRESETS.map((preset) => (<button key={preset.label} onClick={() => applyPreset(sec.id, cIdx, preset.start, preset.end)} className="px-3 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 text-[10px] font-bold rounded-full transition-colors whitespace-nowrap">{preset.label}</button>))}</div>
                      <div className="flex gap-2 items-center"><select className="p-2 rounded-lg text-xs border border-slate-200 bg-white" value={cls.day} onChange={e => updateClass(sec.id, cIdx, 'day', e.target.value)}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select><div className="relative"><input type="time" className={`p-2 rounded-lg text-xs border bg-white ${isSuspiciousTime(cls.start) ? 'border-red-400 text-red-500 font-bold' : 'border-slate-200'}`} value={cls.start} onChange={e => updateClass(sec.id, cIdx, 'start', e.target.value)} /></div><span className="text-slate-400">-</span><input type="time" className="p-2 rounded-lg text-xs border border-slate-200 bg-white" value={cls.end} onChange={e => updateClass(sec.id, cIdx, 'end', e.target.value)} />{sec.classes.length > 1 && <button onClick={() => removeClassSlot(sec.id, cIdx)} className="text-red-400 hover:bg-red-50 p-1 rounded transition-colors"><XCircle size={14} /></button>}</div>
                      {isSuspiciousTime(cls.start) && <div className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">⚠️ That is {cls.start} AM.</div>}
                    </div>
                  ))}
                  <button onClick={() => addClassSlot(sec.id)} className={`text-[10px] ${BRAND.primaryText} font-bold hover:underline ml-2`}>+ Add another day</button>
                </div>
              ) : (<div className={`p-4 ${BRAND.primaryLight} rounded-xl ${BRAND.primaryText} text-xs font-bold text-center border ${BRAND.primaryBorder} flex flex-col items-center gap-2`}><Clock size={20} className="opacity-50"/>No scheduled time.</div>)}
            </div>
          ))}
        </div>
        <div className="flex gap-3"><button onClick={addSection} className="flex-1 py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl font-bold hover:border-indigo-400 hover:text-indigo-500 transition-colors">Add Option</button><button onClick={handleSave} className={`flex-1 py-3 ${BRAND.primary} ${BRAND.primaryHover} text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95`}>
            <Save size={18} /> Save Subject
        </button></div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function Home() {
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // MONETIZATION STATES
  const [tokens, setTokens] = useState(0);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showSmartGenModal, setShowSmartGenModal] = useState(false);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  // AI STATES
  const [aiPrompt, setAiPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeFilter, setActiveFilter] = useState<any>(null);

  useEffect(() => {
      async function initData() {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
              try {
                  const parsed = JSON.parse(cached);
                  const migrated = parsed.map((s: any) => ({ 
                      ...s, 
                      credits: typeof s.credits === 'number' ? s.credits : 3, 
                      noTime: s.noTime ?? false 
                  }));
                  setSubjects(migrated);
                  setIsLoaded(true); 
              } catch (e) { console.error("Cache parse error", e); }
          }

          if (status === 'authenticated') {
              try {
                  const balance = await getUserTokens();
                  setTokens(balance);
                  const dbData = await loadScheduleFromDB();
                  if (dbData && Array.isArray(dbData)) {
                      setSubjects(dbData);
                      localStorage.setItem(CACHE_KEY, JSON.stringify(dbData)); 
                  }
              } catch (e) { console.error("DB Sync Error", e); }
          } else if (status === 'unauthenticated' && !cached) {
              const legacy = localStorage.getItem('next-scheduler-prod-v1');
              if (legacy) {
                  try {
                      setSubjects(JSON.parse(legacy));
                      localStorage.setItem(CACHE_KEY, legacy); 
                  } catch(e) {}
              }
          }
          setIsLoaded(true);
      }
      initData();
  }, [status]);

  const persistData = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newSubjects));
    if (status === 'authenticated') {
      setSaving(true);
      try { await saveScheduleToDB(newSubjects); } catch (e) { console.error("Failed to sync to DB", e); }
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('next-scheduler-prod-v1'); 
    setSubjects([]); 
    setTokens(0);
    signOut();
  };

  const startAdFlow = () => {
    if (status !== 'authenticated') return alert("Login to save tokens!");
    setShowTokenModal(false); 
    setShowAdOverlay(true); 
  };

  const handleClaimAdReward = async () => {
    const result = await rewardTokens();
    if (result.success && typeof result.newBalance === 'number') {
        setTokens(result.newBalance);
        setShowAdOverlay(false);
        alert("Success! +5 Tokens added.");
    } else {
        alert(result.error || "Failed to claim reward.");
    }
  };

  const handleBuyTokens = async (packageId: 'starter' | 'pro') => {
      if (status !== 'authenticated') return alert("Please login first.");
      try {
          const res = await fetch('/api/stripe/checkout', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packageId }) 
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
      } catch(e) {
          alert("Payment failed to initialize");
      }
  };

  const handleAiSubmit = async () => {
      if (!aiPrompt.trim()) return;
      setIsThinking(true);
      
      const response = await generateAiAction(aiPrompt, subjects);
      
      if (response.success && response.result) {
          const { action, data } = response.result;

          if (action === "ADD") {
              const newSubject: Subject = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: data.name || "New Subject",
                  section: data.section || "1",
                  credits: data.credits || 3,
                  noTime: false,
                  active: true,
                  color: PALETTE[subjects.length % PALETTE.length],
                  classes: (data.classes && Array.isArray(data.classes) && data.classes.length > 0)
                      ? data.classes 
                      : [{ day: "Monday", start: "09:00", "end": "12:00" }]
              };
              const newSubjects = [...subjects, newSubject];
              persistData(newSubjects);
              alert(`AI: Added "${newSubject.name}"`);
          }

          else if (action === "REMOVE") {
              const targetName = data.name.toLowerCase();
              const filtered = subjects.filter(s => !s.name.toLowerCase().includes(targetName));
              
              if (filtered.length === subjects.length) {
                  alert(`AI: Could not find subject "${data.name}" to remove.`);
              } else {
                  persistData(filtered);
                  alert(`AI: Removed "${data.name}"`);
              }
          }

          else if (action === "UPDATE") {
             const targetName = data.targetName.toLowerCase();
             let found = false;
             const updated = subjects.map(s => {
                 if (s.name.toLowerCase().includes(targetName)) {
                     found = true;
                     return { ...s, ...data.updates };
                 }
                 return s;
             });
             
             if (found) {
                 persistData(updated);
                 alert(`AI: Updated "${data.targetName}"`);
             } else {
                 alert(`AI: Could not find "${data.targetName}" to update.`);
             }
          }

          else if (action === "FILTER") {
              setActiveFilter(data);
              alert("AI: Filter applied to generated schedules.");
          }

          if (typeof response.newBalance === 'number') setTokens(response.newBalance);
          setShowSmartGenModal(false);
          setAiPrompt("");

      } else {
          alert(response.error || "AI could not understand request.");
          if (response.error === "Insufficient tokens") {
             setShowSmartGenModal(false);
             setShowTokenModal(true);
          }
      }
      setIsThinking(false);
  };

  const handleEdit = (name: string) => {
    setEditingName(name);
    setShowAddForm(true);
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

    const isOverlapping = (c1: ClassSession, c2: ClassSession) => { 
        if (c1.day !== c2.day) return false; 
        return Math.max(timeToMin(c1.start), timeToMin(c2.start)) < Math.min(timeToMin(c1.end), timeToMin(c2.end)); 
    };

    const hasConflict = (schedule: Subject[], newSubject: Subject) => { 
        if (newSubject.noTime) return false; 
        for (let existing of schedule) { 
            if (existing.noTime) continue; 
            for (let c1 of existing.classes) { 
                for (let c2 of newSubject.classes) { 
                    if (isOverlapping(c1, c2)) return true; 
                } 
            } 
        } 
        return false; 
    };

    const buildSchedule = (index: number, currentSchedule: Subject[]) => { 
        if (results.length >= 50) return; 
        if (index === names.length) { results.push(currentSchedule); return; } 
        const subjectName = names[index]; 
        const sections = grouped[subjectName]; 
        for (let section of sections) { 
            if (!hasConflict(currentSchedule, section)) { 
                buildSchedule(index + 1, [...currentSchedule, section]); 
            } 
        } 
    };
    buildSchedule(0, []);

    if (activeFilter) {
        return results.filter(sched => {
            let isValid = true;
            if (activeFilter.days_off && Array.isArray(activeFilter.days_off)) {
                const hasForbiddenDay = sched.some(sub => sub.classes.some(cls => activeFilter.days_off.includes(cls.day)));
                if (hasForbiddenDay) isValid = false;
            }
            if (isValid && activeFilter.start_time_after) {
                const minTime = timeToMin(activeFilter.start_time_after);
                const hasEarlyClass = sched.some(sub => sub.classes.some(cls => timeToMin(cls.start) < minTime));
                if (hasEarlyClass) isValid = false;
            }
            if (isValid && activeFilter.end_time_before) {
                const maxTime = timeToMin(activeFilter.end_time_before);
                const hasLateClass = sched.some(sub => sub.classes.some(cls => timeToMin(cls.end) > maxTime));
                if (hasLateClass) isValid = false;
            }
            if (isValid && activeFilter.same_day && Array.isArray(activeFilter.same_day) && activeFilter.same_day.length > 1) {
                const targetSubjects = sched.filter(sub => activeFilter.same_day.some((targetName: string) => sub.name.toLowerCase().includes(targetName.toLowerCase())));
                if (targetSubjects.length === activeFilter.same_day.length) {
                    const subjectDays = targetSubjects.map(sub => sub.classes.map(c => c.day));
                    const commonDays = subjectDays.reduce((a, b) => a.filter(c => b.includes(c)));
                    if (commonDays.length === 0) isValid = false;
                }
            }
            return isValid;
        });
    }
    return results;
  }, [subjects, isLoaded, activeFilter]);

  const calculateCredits = (schedule: Subject[]) => schedule.reduce((sum, s) => sum + (s.credits || 0), 0);
  const calculateTotalActiveCredits = () => { const activeNames = new Set(); let total = 0; subjects.filter(s => s.active).forEach(s => { if (!activeNames.has(s.name)) { total += (s.credits || 0); activeNames.add(s.name); } }); return total; };

  const downloadPDF = async (index: number) => {
    const id = `schedule-option-${index}`;
    setExportingId(id);
    setTimeout(async () => {
        const element = document.getElementById(id);
        if (element) {
            try {
                const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff', width: 1920, height: element.offsetHeight });
                const imgProps = new jsPDF().getImageProperties(dataUrl);
                const pdf = new jsPDF({ orientation: imgProps.width > imgProps.height ? 'l' : 'p', unit: 'px', format: [imgProps.width, imgProps.height] });
                pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
                pdf.save(`my-schedule-option-${index + 1}.pdf`);
            } catch (err) { console.error("Export failed", err); alert("Failed to export PDF."); }
        }
        setExportingId(null);
    }, 100);
  };

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 font-sans">
      
      {/* --- MODALS & OVERLAYS --- */}
      {showAdOverlay && <AdOverlay onClose={() => setShowAdOverlay(false)} onClaim={handleClaimAdReward} />}
      {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}
      {showSmartGenModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-indigo-500 fill-indigo-500"/> Smart AI</h2>
                      <button onClick={() => setShowSmartGenModal(false)}><XCircle className="text-slate-300 hover:text-slate-500 transition-colors"/></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Describe your perfect schedule in plain English. Our AI will filter the options for you.</p>
                  <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 mb-4" placeholder="e.g., Add Python on Fridays 1pm to 4pm" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}/>
                  <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Cost: <span className="text-pink-500">5 Tokens</span></span><button onClick={handleAiSubmit} disabled={isThinking || !aiPrompt} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95">{isThinking ? <><Clock size={16} className="animate-spin"/> Thinking...</> : <><Zap size={16} className="fill-white"/> Generate</>}</button></div>
              </div>
          </div>
      )}

      {/* --- RECHARGE TOKENS MODAL --- */}
      {showTokenModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Gem className="text-pink-500 fill-pink-500"/> Get More Tokens</h2>
                    <button onClick={() => setShowTokenModal(false)}><XCircle className="text-slate-300 hover:text-slate-500 transition-colors"/></button>
                    </div>
                  <div className="grid grid-cols-1 gap-6">
                      <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 p-6 rounded-2xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-xl">FREE</div>
                        <PlayCircle size={32} className="mx-auto text-indigo-500 mb-2"/>
                        <h3 className="font-bold text-indigo-900">Watch Ad</h3>
                        <p className="text-xs text-indigo-600 mb-3">+5 Tokens</p>
                        <button onClick={startAdFlow} className="bg-white border-2 border-indigo-100 hover:border-indigo-300 text-indigo-600 w-full py-2 rounded-xl font-bold shadow-sm transition-all text-sm active:scale-95">Watch Now</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="border border-slate-200 p-4 rounded-2xl text-center opacity-80 hover:opacity-100 transition-opacity hover:shadow-md cursor-pointer">
                              <h3 className="font-bold text-slate-700 text-sm">Starter</h3>
                              <div className="text-2xl font-black text-slate-800 my-1">฿35</div>
                              <p className="text-xs text-slate-400 mb-3">100 Tokens</p>
                              <button onClick={() => handleBuyTokens('starter')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-full py-2 rounded-xl font-bold text-xs transition-colors">Buy</button>
                          </div>
                          <div className="border-2 border-indigo-500 bg-white p-4 rounded-2xl text-center relative shadow-xl transform scale-105 transition-transform hover:scale-110">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">BEST VALUE</div>
                              <h3 className="font-bold text-indigo-900 text-sm mt-1">Pro Pack</h3>
                              <div className="text-2xl font-black text-indigo-600 my-1">฿150</div>
                              <p className="text-xs text-indigo-400 mb-3 font-bold">500 Tokens</p>
                              <button onClick={() => handleBuyTokens('pro')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-xl font-bold text-xs shadow-lg animate-pulse transition-all active:scale-95">Buy Now</button>
                          </div>
                      </div>
                      <div className="text-center"><p className="text-[10px] text-slate-400 flex items-center justify-center gap-1"><CreditCard size={10}/> Secure payment via Stripe (PromptPay Supported)</p></div>
                </div>
              </div>
          </div>
      )}

      {/* --- ACTIVE FILTER BANNER --- */}
      {activeFilter && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-yellow-400"/><span className="text-sm font-medium">AI Filter Active</span></div><div className="h-4 w-px bg-slate-700"></div><button onClick={() => setActiveFilter(null)} className="text-xs text-slate-400 hover:text-white font-bold transition-colors">CLEAR</button>
            </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div><h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><GraduationCap className={BRAND.logoColor} size={32} /> {BRAND.name}</h1></div>
          
          {/* Header Controls */}
          <div className="flex w-full md:w-auto justify-between md:justify-end gap-3 items-center">
             
             {/* Left Group: Profile + Coffee */}
             <div className='flex gap-3 items-center'>
                {status === 'loading' ? (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-sm border border-slate-200 animate-pulse w-48 h-12"></div>
                ) : status === 'authenticated' ? (
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-slate-200">
                        {session.user?.image ? (
                            <div className="relative w-8 h-8">
                                <Image src={session.user.image} alt="User" fill className="rounded-full object-cover" sizes="32px"/>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: stringToColor(session.user?.name || 'User') }}>{(session.user?.name?.[0] || 'U').toUpperCase()}</div>
                        )}
                        <div className="text-xs text-left">
                            <div className="font-bold text-slate-700">{session.user?.name}</div>
                            <div onClick={() => setShowTokenModal(true)} className="text-pink-500 font-bold text-[10px] cursor-pointer hover:underline flex items-center gap-1"><Gem size={10}/> {tokens} Tokens</div>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 ml-2" title="Sign Out"><LogOut size={16}/></button>
                    </div>
                ) : (
                    <button onClick={() => signIn('google')} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-shadow"><LogIn size={16}/> Login to Sync</button>
                )}

                {/* COFFEE BUTTON (FIXED ALIGNMENT) */}
                <button 
                    onClick={() => setShowDonationModal(true)} 
                    className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-white hover:bg-yellow-50 text-yellow-500 border border-slate-200 hover:border-yellow-200 rounded-full shadow-sm transition-all active:scale-95"
                    title="Buy me a coffee"
                >
                    <Coffee size={20} />
                </button>
             </div>

             {/* Right Group: Add Subject */}
             <div className="flex items-center">
                <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <button onClick={() => { setEditingName(null); setShowAddForm(!showAddForm); }} className={`${BRAND.primary} ${BRAND.primaryHover} text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap h-10`}>
                    <Plus size={18} /> <span className="hidden sm:inline">Add Subject</span><span className="sm:hidden">Add</span>
                </button>
             </div>

          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR / TOP BAR */}
          <div className="w-full lg:w-[400px] flex-shrink-0 space-y-6">
            <div onClick={() => setShowSmartGenModal(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-xl text-white cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-white/20 p-2 rounded-lg"><Sparkles size={24} className="text-yellow-300 fill-yellow-300 animate-pulse"/></div>
                <div><h3 className="font-bold text-sm">Smart AI Filter</h3><p className="text-xs text-indigo-100 opacity-80">"I want Fridays off..."</p></div>
                <div className="ml-auto bg-black/20 px-2 py-1 rounded text-[10px] font-bold">5 <Gem size={8} className="inline"/></div>
            </div>

            {showAddForm ? (<AddSubjectForm onSave={handleSaveSubject} onCancel={() => { setShowAddForm(false); setEditingName(null); }} initialName={editingName || undefined} initialCredits={editingName ? subjects.find(s => s.name === editingName)?.credits : undefined} initialSections={editingName ? subjects.filter(s => s.name === editingName) : undefined} />) : (
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm uppercase text-slate-400">Library</h3><button onClick={() => {if(window.confirm('Clear all?')) persistData([])}} className="text-xs text-red-400 hover:text-red-600 transition-colors">Reset</button></div>
                {Object.keys(groupedSubjects).length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Library is empty.<br/>{status === 'unauthenticated' && 'Login to load your saved schedule.'}</div>}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(groupedSubjects).map(([name, group]) => {
                    const allActive = group.every(s => s.active);
                    const someActive = group.some(s => s.active);
                    const color = group[0].color;
                    const credits = group[0].credits || 0;
                    return (
                      <div key={name} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-all hover:shadow-sm">
                        <div className="bg-white p-3 border-b border-slate-100 flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${someActive ? `${BRAND.primary} border-transparent` : 'border-slate-300'}`} onClick={() => toggleSubjectGroup(name, !allActive)}>{someActive && <CheckCircle size={10} className="text-white" />}</div>
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <div className="flex-1 font-bold text-sm text-slate-700">{name} <span className="text-slate-400 font-normal text-xs ml-1">({credits} Cr)</span></div>
                          <div className="flex gap-1"><button onClick={() => handleEdit(name)} className={`p-1 text-slate-300 ${BRAND.primaryHover} hover:text-white rounded transition-colors`}><Edit2 size={14} /></button><button onClick={() => deleteSubjectGroup(name)} className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} /></button></div>
                        </div>
                        <div className="bg-slate-50 p-2 space-y-1">
                          {group.map(s => (<div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl text-xs ${s.active ? 'bg-white shadow-sm text-slate-700' : 'opacity-50 text-slate-400'} transition-all`}><input type="checkbox" checked={s.active} onChange={() => toggleSection(s.id)} className={`rounded ${BRAND.primaryText} cursor-pointer`}/><span className="font-mono font-bold bg-slate-100 px-1 rounded text-[10px]">SEC {s.section}</span><div className="flex-1 text-[10px]">{s.noTime ? <span className="italic text-slate-500">No fixed time</span> : s.classes.map((c, i) => (<span key={i} className="mr-2">{c.day.slice(0,3)} {c.start}</span>))}</div></div>))}
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
              generatedSchedules.map((schedule, idx) => {
                const tags = analyzeSchedule(schedule);
                return (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  
                  {/* --- HEADER CONTAINER --- */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 px-4 md:px-0 md:ml-4">
                      
                      {/* TOP ROW: Option + Credits + Mobile PDF */}
                      <div className="flex items-center justify-between w-full md:w-auto gap-3">
                          <div className="flex items-center gap-3">
                              <div className={`${BRAND.secondary} text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                                  Option #{idx + 1}
                              </div>
                              <div className={`text-xs font-bold ${BRAND.accent} ${BRAND.accentBg} px-3 py-1 rounded-full border ${BRAND.accentBorder} whitespace-nowrap`}>
                                  {calculateCredits(schedule)} Credits
                              </div>
                          </div>
                          
                          {/* PDF Button (Visible on Mobile Only here) */}
                          <button onClick={() => downloadPDF(idx)} disabled={exportingId !== null} className={`md:hidden bg-white border border-slate-200 hover:border-${BRAND.primary.replace('bg-', '')} text-slate-500 ${BRAND.primaryText.replace('text-', 'hover:text-')} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50`}>
                              <Download size={14}/> PDF
                          </button>
                      </div>
                      
                      {/* TAGS ROW (Scrollable on Mobile) */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 mask-linear">
                          {tags.map((tag, tIdx) => (
                              <div key={tIdx} className={`px-2 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${tag.color} whitespace-nowrap`}>
                                  <tag.icon size={12} /> {tag.text}
                              </div>
                          ))}
                      </div>

                      {/* PDF Button (Desktop Only) */}
                      <div className="hidden md:block flex-1 h-px bg-slate-200 mx-2"></div>
                      <button onClick={() => downloadPDF(idx)} disabled={exportingId !== null} className={`hidden md:flex bg-white border border-slate-200 hover:border-${BRAND.primary.replace('bg-', '')} text-slate-500 ${BRAND.primaryText.replace('text-', 'hover:text-')} px-3 py-1 rounded-full text-xs font-bold items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50`}>
                          <Download size={14}/> {exportingId === `schedule-option-${idx}` ? 'Saving...' : 'PDF'}
                      </button>
                  </div>

                  <TimeSlotGrid schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} />
                </div>
              )})
            )}
          </div>
        </div>
        
        {/* FOOTER */}
        <footer className="mt-20 py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
            <p className="mb-3">&copy; {new Date().getFullYear()} {BRAND.name}. Built for students, by students.</p>
            <div className="flex justify-center items-center gap-4">
                <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
                <span className="text-slate-300">|</span>
                <button onClick={() => setShowDonationModal(true)} className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-yellow-600 transition-colors"><Coffee size={14} className="text-yellow-500"/> Buy me a coffee</button>
            </div>
        </footer>
      </div>
    </main>
  );
}