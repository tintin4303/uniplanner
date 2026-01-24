import React from 'react';
import { GraduationCap, List, Clock } from 'lucide-react';
import { BRAND, DAYS } from '@/app/lib/constants';
import { Subject, Theme } from '@/app/lib/types';
import { timeToMin } from '@/app/lib/utils';
import { getDefaultTheme } from '@/app/lib/themes';

interface ScheduleTableProps {
  schedule: Subject[];
  id: string;
  exporting?: boolean;
  theme?: Theme;
  comparisonSchedule?: Subject[];
}

export default function ScheduleTable({ schedule, id, exporting, theme, comparisonSchedule }: ScheduleTableProps) {
  const activeTheme = theme || getDefaultTheme();
  const START_HOUR = 8;
  const END_HOUR = 20;
  const scheduledSubjects = schedule.filter(s => !s.noTime);
  const comparisonSubjects = comparisonSchedule?.filter(s => !s.noTime) || [];
  const totalCredits = schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div id={id} className={`${exporting ? 'bg-white' : 'bg-white shadow-xl border border-slate-200'} mb-8 flex flex-col w-full transition-all duration-300`} style={exporting ? { width: '1920px', minWidth: '1920px', margin: 0, border: 'none' } : {}}>

      <div className={`${activeTheme.colors.header} ${activeTheme.colors.headerText} p-4 md:p-6 flex justify-between items-center border-b border-slate-800`}>
        <div>
          <div className="font-black text-lg md:text-2xl tracking-widest flex items-center gap-3 uppercase">
            <GraduationCap size={28} className="text-white opacity-80" /> {BRAND.name}
          </div>
          <div className="text-xs text-slate-400 mt-1">Generated Schedule</div>
        </div>
        <div className="text-right">
          <div className={`text-xl md:text-3xl font-bold ${activeTheme.colors.accent}`}>{totalCredits} <span className="text-xs md:text-lg font-normal text-slate-400">Credits</span></div>
          <div className="text-[10px] md:text-sm text-slate-400">{schedule.length} Subjects Selected</div>
        </div>
      </div>
      <div className="w-full grid bg-slate-50 divide-x divide-slate-200 border-b border-slate-200 grid-cols-[30px_repeat(7,minmax(0,1fr))] sm:grid-cols-[50px_repeat(7,minmax(0,1fr))] lg:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className="p-1 sm:p-2 lg:p-4 border-b border-slate-200 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-400 text-center flex items-center justify-center">TIME</div>
        {DAYS.map(day => (<div key={day} className="p-1 sm:p-2 lg:p-4 border-b border-slate-200 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-600 text-center uppercase tracking-wider overflow-hidden"><span className="lg:hidden">{day.substring(0, 3)}</span><span className="hidden lg:inline">{day}</span></div>))}
        <div className="relative border-r border-slate-200 bg-white" style={{ height: '700px' }}>
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full text-right pr-1 sm:pr-2 lg:pr-3 text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 font-medium transform -translate-y-1/2 border-t border-transparent" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}>{String(START_HOUR + i).padStart(2, '0')}:00</div>))}
        </div>
        {DAYS.map(day => (
          <div key={day} className="relative bg-white h-[700px] group transition-colors hover:bg-slate-50">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full border-t border-slate-100" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }} />))}
            {scheduledSubjects.map((subject, subjectIndex) => {
              const daysClasses = subject.classes.filter(c => c.day === day);
              const themeColor = activeTheme.colors.subjectPalette[subjectIndex % activeTheme.colors.subjectPalette.length];
              return daysClasses.map((cls, idx) => {
                const startMin = timeToMin(cls.start);
                const endMin = timeToMin(cls.end);
                const topPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                const heightPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;
                return (
                  <div key={`${subject.id}-${idx}`} className={`absolute inset-x-0.5 sm:inset-x-1 rounded p-0.5 sm:p-1 lg:p-2 text-white shadow-sm z-10 flex flex-col justify-center items-center text-center overflow-hidden leading-tight ${themeColor} hover:scale-[1.02] transition-transform`} style={{ top: `${topPerc}%`, height: `${heightPerc}%`, minHeight: '35px' }}>
                    <span className="font-black text-[6px] sm:text-[8px] lg:text-[11px] uppercase w-full break-words leading-none mb-0.5" style={{ wordBreak: 'break-word' }}>{subject.name}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[10px] opacity-90 font-medium leading-none">Sec {subject.section}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[9px] opacity-75 mt-0.5 hidden sm:block leading-none">{cls.start} - {cls.end}</span>
                  </div>
                );
              });
            })}
            {comparisonSubjects.map((subject, subjectIndex) => {
              const daysClasses = subject.classes.filter(c => c.day === day);
              return daysClasses.map((cls, idx) => {
                const startMin = timeToMin(cls.start);
                const endMin = timeToMin(cls.end);
                const topPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                const heightPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;
                return (
                  <div key={`compare-${subject.id}-${idx}`} className="absolute inset-x-0.5 sm:inset-x-1 rounded p-0.5 sm:p-1 lg:p-2 border-2 border-dashed border-slate-400 bg-white/70 z-20 flex flex-col justify-center items-center text-center overflow-hidden leading-tight hover:bg-white transition-colors pointer-events-none" style={{ top: `${topPerc}%`, height: `${heightPerc}%`, minHeight: '35px' }}>
                    <span className="font-extrabold text-[6px] sm:text-[8px] lg:text-[11px] uppercase w-full break-words leading-none mb-0.5 text-slate-600" style={{ wordBreak: 'break-word' }}>{subject.name}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[10px] opacity-90 font-bold leading-none text-slate-500">Sec {subject.section}</span>
                    <span className="text-[5px] sm:text-[7px] lg:text-[9px] font-bold text-slate-400 mt-0.5 hidden sm:block leading-none">IMPORT</span>
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
          {schedule.map((subject, subjectIndex) => {
            const themeColor = activeTheme.colors.subjectPalette[subjectIndex % activeTheme.colors.subjectPalette.length];
            return (
              <div key={subject.id} className="border border-slate-200 rounded-xl p-3 lg:p-4 flex items-start gap-3 lg:gap-4 bg-slate-50 break-inside-avoid">
                <div className={`w-3 h-3 mt-1.5 rounded-full ${themeColor} flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-xs sm:text-sm break-words whitespace-normal leading-snug mb-2">{subject.name}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2 lg:gap-3 items-center"><span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">Sec {subject.section}</span><span className={`font-bold ${activeTheme.colors.accent} whitespace-nowrap`}>{subject.credits} Credits</span></div>
                  {subject.noTime && <div className="text-[10px] lg:text-[11px] text-orange-600 mt-2 italic flex items-center gap-1"><Clock size={12} /> No scheduled time</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}