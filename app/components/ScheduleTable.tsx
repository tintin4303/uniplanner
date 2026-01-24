import React from 'react';
import { GraduationCap, List, Clock } from 'lucide-react';
import { BRAND, DAYS } from '@/app/lib/constants';
import { Subject, Theme } from '@/app/lib/types';
import { timeToMin } from '@/app/lib/utils';
import { getDefaultTheme } from '@/app/lib/themes';
import ComparisonTooltip from './ComparisonTooltip';
import { useFriendMatch } from '@/app/hooks/useFriendMatch';

interface ScheduleTableProps {
  schedule: Subject[];
  id: string;
  exporting?: boolean;
  theme?: Theme;
  comparisonSchedule?: Subject[];
}

export default function ScheduleTable({ schedule, id, exporting, theme, comparisonSchedule }: ScheduleTableProps) {
  const activeTheme = theme || getDefaultTheme();
  const { getConflictComment } = useFriendMatch();
  const START_HOUR = 8;
  const END_HOUR = 20;
  const scheduledSubjects = schedule.filter(s => !s.noTime);
  const comparisonSubjects = comparisonSchedule?.filter(s => !s.noTime) || [];
  const totalCredits = schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

  // Dynamic Sizing for Export Readability
  const timeColClass = exporting ? 'p-2 text-sm font-bold text-slate-500' : 'p-1 sm:p-2 lg:p-4 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-400';
  const headerDayClass = exporting ? 'p-2 text-sm font-bold text-slate-700' : 'p-1 sm:p-2 lg:p-4 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-600';
  const blockNameClass = exporting ? 'text-xs font-black leading-tight mb-1' : 'font-black text-[6px] sm:text-[8px] lg:text-[11px] leading-none mb-0.5';
  const blockMetaClass = exporting ? 'text-[10px] font-bold leading-tight' : 'text-[5px] sm:text-[7px] lg:text-[10px] font-medium leading-none';

  return (
    <div id={id} className={`${exporting ? 'bg-white' : 'bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800'} mb-8 flex flex-col w-full transition-all duration-300`} style={exporting ? { width: '1920px', minWidth: '1920px', margin: 0, border: 'none' } : {}}>

      <div className={`${activeTheme.colors.header} ${activeTheme.colors.headerText} p-4 md:p-6 flex justify-between items-center border-b border-slate-800`}>
        <div>
          <div className="font-black text-lg md:text-2xl tracking-widest flex items-center gap-3 uppercase">
            <GraduationCap size={28} className="text-white opacity-80" /> {BRAND.name}
          </div>
          <div className="text-xs text-white opacity-80 mt-1">Generated Schedule</div>
        </div>
        <div className="text-right">
          <div className="text-xl md:text-3xl font-bold text-white">{totalCredits} <span className="text-xs md:text-lg font-normal text-white opacity-90">Credits</span></div>
          <div className="text-[10px] md:text-sm text-white opacity-70">{schedule.length} Subjects Selected</div>
        </div>
      </div>
      <div className="w-full grid bg-slate-50 dark:bg-slate-950 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 grid-cols-[30px_repeat(7,minmax(0,1fr))] sm:grid-cols-[50px_repeat(7,minmax(0,1fr))] lg:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className={`${timeColClass} border-b border-slate-200 dark:border-slate-800 text-center flex items-center justify-center`}>TIME</div>
        {DAYS.map(day => (<div key={day} className={`${headerDayClass} border-b border-slate-200 dark:border-slate-800 text-center uppercase tracking-wider overflow-hidden dark:text-slate-400`}><span className="lg:hidden">{day.substring(0, 3)}</span><span className="hidden lg:inline">{day}</span></div>))}
        <div className="relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ height: '700px' }}>
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full text-right pr-1 sm:pr-2 lg:pr-3 text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 font-medium transform -translate-y-1/2 border-t border-transparent" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}>{String(START_HOUR + i).padStart(2, '0')}:00</div>))}
        </div>
        {DAYS.map(day => (
          <div key={day} className="relative bg-white dark:bg-slate-900 h-[700px] group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (<div key={i} className="absolute w-full border-t border-slate-100 dark:border-slate-800" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }} />))}
            {/* 1. Render User's Classes (Normal Z-Index) */}
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
                    <span className={`${blockNameClass} uppercase w-full break-words`} style={{ wordBreak: 'break-word' }}>{subject.name}</span>
                    <span className={`${blockMetaClass} opacity-90`}>Sec {subject.section}</span>
                    <span className={`${blockMetaClass} opacity-75 mt-0.5 hidden sm:block`}>{cls.start} - {cls.end}</span>
                  </div>
                );
              });
            })}

            {/* 2. Render Comparison Classes (On Top, Interactive if Conflict) */}
            {comparisonSubjects.map((subject, subjectIndex) => {
              const daysClasses = subject.classes.filter(c => c.day === day);
              return daysClasses.map((cls, idx) => {
                const startMin = timeToMin(cls.start);
                const endMin = timeToMin(cls.end);
                const topPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                const heightPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;

                // Check for conflict with ANY user class
                const conflict = scheduledSubjects.find(userSub =>
                  userSub.classes.some(userCls =>
                    userCls.day === day &&
                    !(timeToMin(userCls.end) <= startMin || timeToMin(userCls.start) >= endMin)
                  )
                );

                const conflictingSession = conflict?.classes.find(c => c.day === day && !(timeToMin(c.end) <= startMin || timeToMin(c.start) >= endMin));

                const isMatch = conflict && conflict.name === subject.name && conflict.section === subject.section;

                return (
                  <div
                    key={`compare-${subject.id}-${idx}`}
                    className={`absolute inset-x-0.5 sm:inset-x-1 rounded p-0.5 sm:p-1 lg:p-2 border-2 border-dashed flex flex-col justify-center items-center text-center leading-tight transition-all z-20 group/ghost
                      ${conflict
                        ? isMatch
                          ? 'border-emerald-500 bg-emerald-100/90 dark:bg-emerald-900/40 cursor-help hover:z-50 hover:bg-emerald-50 dark:hover:bg-emerald-900/60' // Match Styles
                          : 'border-red-500 bg-white/90 dark:bg-red-900/30 cursor-help hover:z-50 hover:bg-white dark:hover:bg-red-900/50' // Conflict Styles
                        : 'border-slate-400 dark:border-slate-500 bg-white/70 dark:bg-slate-700/60 pointer-events-none' // No Overlap
                      }`}
                    style={{
                      top: `${topPerc}%`,
                      height: `${heightPerc}%`,
                      minHeight: '35px',
                      ...(conflict && !isMatch ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)' } : {}),
                      ...(isMatch ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.1) 10px, rgba(16, 185, 129, 0.1) 20px)' } : {})
                    }}
                  >
                    {/* Tooltip on Hover (Only if conflict) */}
                    {conflict && conflictingSession && (
                      <div className="hidden group-hover/ghost:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[250px] z-[100]">
                        <ComparisonTooltip
                          userSubject={conflict}
                          friendSubject={subject}
                          userSession={conflictingSession}
                          friendSession={cls}
                          isMatch={isMatch}
                          comment={isMatch ? "You're in the same class! Sit together! 👯‍♂️" : getConflictComment(conflictingSession.start, conflictingSession.end, cls.start, cls.end)}
                        />
                      </div>
                    )}

                    {/* Content Container (Overflow Hidden to keep text nice) */}
                    <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center">
                      <span className={`${blockNameClass} uppercase w-full break-words ${conflict ? (isMatch ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-600 dark:text-red-300 font-bold') : 'text-slate-600 dark:text-slate-200'}`} style={{ wordBreak: 'break-word' }}>
                        {subject.name}
                      </span>
                      <span className={`${blockMetaClass} opacity-90 ${conflict ? (isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-300') : 'text-slate-500 dark:text-slate-400'}`}>
                        Sec {subject.section}
                      </span>
                      {conflict && (
                        <div className={`${isMatch ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-red-500 dark:bg-red-600'} text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full mt-1 animate-pulse shadow-sm`}>
                          {isMatch ? 'MATCH!' : 'CONFLICT'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 p-4 lg:p-8">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 lg:mb-6 flex items-center gap-2 uppercase tracking-wider border-b pb-4 dark:border-slate-800"><List size={20} className={BRAND.primaryText} /> Selected Subjects Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {schedule.map((subject, subjectIndex) => {
            const themeColor = activeTheme.colors.subjectPalette[subjectIndex % activeTheme.colors.subjectPalette.length];
            return (
              <div key={subject.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 lg:p-4 flex items-start gap-3 lg:gap-4 bg-slate-50 dark:bg-slate-800/50 break-inside-avoid">
                <div className={`w-3 h-3 mt-1.5 rounded-full ${themeColor} flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm break-words whitespace-normal leading-snug mb-2">{subject.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 lg:gap-3 items-center"><span className="font-mono bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 whitespace-nowrap">Sec {subject.section}</span><span className={`font-bold ${activeTheme.colors.accent} whitespace-nowrap`}>{subject.credits} Credits</span></div>
                  {subject.noTime && <div className="text-[10px] lg:text-[11px] text-orange-600 dark:text-orange-400 mt-2 italic flex items-center gap-1"><Clock size={12} /> No scheduled time</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}