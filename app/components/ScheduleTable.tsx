import React from 'react';
import { GraduationCap, List, Clock, AlertTriangle, Check } from 'lucide-react';
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
  const [selectedConflictId, setSelectedConflictId] = React.useState<string | null>(null);
  const ignoreNextClick = React.useRef(false);

  React.useEffect(() => {
    const closeTooltip = () => {
      if (ignoreNextClick.current) {
        ignoreNextClick.current = false;
        return;
      }
      setSelectedConflictId(null);
    };
    document.addEventListener('click', closeTooltip);
    return () => document.removeEventListener('click', closeTooltip);
  }, []);

  const START_HOUR = 8;
  const END_HOUR = 20;

  const scheduledSubjects = schedule.filter(s => !s.noTime);
  const comparisonSubjects = comparisonSchedule?.filter(s => !s.noTime) || [];
  const totalCredits = schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

  // Dynamic Sizing for Export Readability
  const timeColClass = exporting ? 'p-2 text-sm font-bold text-slate-500' : 'p-1 sm:p-2 lg:p-4 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-400';
  const headerDayClass = exporting ? 'p-2 text-sm font-bold text-slate-700' : 'p-1 sm:p-2 lg:p-4 font-bold text-[8px] sm:text-[10px] lg:text-xs text-slate-600';
  const blockNameClass = exporting ? 'text-xs font-black leading-tight mb-1' : 'font-black text-[10px] md:text-xs lg:text-sm leading-tight mb-0.5';
  const blockMetaClass = exporting ? 'text-[10px] font-bold leading-tight' : 'text-[9px] md:text-[10px] lg:text-[11px] font-medium leading-none';

  return (
    <div id={id} className={`${exporting ? 'bg-white' : 'bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800'} mb-8 flex flex-col w-full transition-all duration-300`} style={exporting ? { width: '1920px', minWidth: '1920px', margin: 0, border: 'none' } : {}}>

      <div className={`${activeTheme.colors.header} ${activeTheme.colors.headerText} p-4 md:p-6 flex justify-between items-center`}>
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
      {/* Scrollable Container for the Horizontal Schedule Grid */}
      <div className="w-full overflow-x-auto custom-scrollbar border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-[800px] md:min-w-[1000px] flex flex-col bg-slate-50 dark:bg-slate-950">
          
          {/* Top Header: Time Axis (X-Axis) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Empty Top-Left Cell for Day Axis */}
            <div className={`w-[60px] md:w-[80px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center ${timeColClass}`}>
              DAY
            </div>
            
            {/* Time Markers */}
            <div className="flex-1 relative h-10 md:h-12">
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1 border-l border-slate-200 dark:border-slate-800" 
                  style={{ left: `${(i / (END_HOUR - START_HOUR)) * 100}%`, width: '1px' }}
                >
                  <div className="transform -translate-x-1/2 text-[10px] md:text-xs font-bold text-slate-400 whitespace-nowrap bg-white dark:bg-slate-900 px-1">
                    {String(START_HOUR + i).padStart(2, '0')}:00
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body: Days Rows (Y-Axis) */}
          <div className="flex flex-col">
            {DAYS.map(day => (
              <div key={day} className="flex border-b border-slate-200 dark:border-slate-800 last:border-b-0 group">
                
                {/* Y-Axis: Day Label Header */}
                <div className={`w-[60px] md:w-[80px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center ${headerDayClass}`}>
                  <span className="md:hidden tracking-wider">{day.substring(0, 3)}</span>
                  <span className="hidden md:inline tracking-wider">{day}</span>
                </div>
                
                {/* X-Axis: Time Track blocks for the Day */}
                <div className="flex-1 relative h-[70px] md:h-[90px] lg:h-[110px] bg-white dark:bg-slate-900 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50">
                  
                  {/* Grid Lines (Vertical) */}
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800/50" 
                      style={{ left: `${(i / (END_HOUR - START_HOUR)) * 100}%` }} 
                    />
                  ))}

                  {/* 1. Render User's Classes (Normal Z-Index) */}
                  {scheduledSubjects.map((subject, subjectIndex) => {
                    const daysClasses = subject.classes.filter(c => c.day === day);
                    const themeColor = activeTheme.colors.subjectPalette[subjectIndex % activeTheme.colors.subjectPalette.length];
                    return daysClasses.map((cls, idx) => {
                      const startMin = timeToMin(cls.start);
                      const endMin = timeToMin(cls.end);
                      const leftPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                      const widthPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;
                      return (
                        <div 
                          key={`${subject.id}-${idx}`} 
                          className={`absolute inset-y-1 md:inset-y-2 rounded-lg p-1.5 md:p-2 text-white shadow-sm z-10 flex flex-col justify-center items-center text-center overflow-hidden leading-tight ${themeColor} hover:scale-[1.01] transition-transform`} 
                          style={{ left: `${leftPerc}%`, width: `${widthPerc}%`, minWidth: '40px' }}
                        >
                          <span className={`${blockNameClass} truncate w-full`} title={subject.name}>{subject.name}</span>
                          <span className={`${blockMetaClass} opacity-90 truncate`}>Sec {subject.section}</span>
                          <span className={`${blockMetaClass} opacity-75 mt-0.5 truncate hidden sm:block`}>{cls.start} - {cls.end}</span>
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
                      const leftPerc = ((startMin - (START_HOUR * 60)) / ((END_HOUR - START_HOUR) * 60)) * 100;
                      const widthPerc = ((endMin - startMin) / ((END_HOUR - START_HOUR) * 60)) * 100;

                      // Check for conflict with ANY user class
                      const conflict = scheduledSubjects.find(userSub =>
                        userSub.classes.some(userCls =>
                          userCls.day === day &&
                          !(timeToMin(userCls.end) <= startMin || timeToMin(userCls.start) >= endMin)
                        )
                      );

                      const conflictingSession = conflict?.classes.find(c => c.day === day && !(timeToMin(c.end) <= startMin || timeToMin(c.start) >= endMin));

                      const cleanSection = (s?: string) => (s || '').replace(/^(sec|section)\.?\s*/i, '').trim().toLowerCase();
                      const isMatch = conflict &&
                        conflict.name.trim().toLowerCase() === subject.name.trim().toLowerCase() &&
                        cleanSection(conflict.section) === cleanSection(subject.section);
                      const conflictId = `compare-${subject.id}-${idx}`;

                      // Case 1: Match -> Render Green Overlay (Interactive, No Text)
                      if (isMatch) {
                        return (
                          <div
                            key={conflictId}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setSelectedConflictId(selectedConflictId === conflictId ? null : conflictId);
                            }}
                            className={`absolute inset-y-1 md:inset-y-2 rounded-lg p-1.5 md:p-2 border-2 border-dashed border-emerald-500 dark:border-emerald-400 flex flex-col justify-center items-center transition-all group/ghost
                              ${selectedConflictId === conflictId ? 'z-[60] bg-white dark:bg-slate-800' : 'z-20 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800'}
                              cursor-pointer`}
                            style={{
                              left: `${leftPerc}%`,
                              width: `${widthPerc}%`,
                              minWidth: '40px',
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.05) 10px, rgba(16, 185, 129, 0.05) 20px)'
                            }}
                          >
                            <div className="text-emerald-600 dark:text-emerald-400 opacity-80">
                              <Check size={20} strokeWidth={3} />
                            </div>

                            {/* Match Tooltip */}
                            {selectedConflictId === conflictId && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[250px] z-[100]" onClick={(e) => e.stopPropagation()}>
                                <ComparisonTooltip
                                  userSubject={conflict}
                                  friendSubject={subject}
                                  userSession={conflictingSession!}
                                  friendSession={cls}
                                  isMatch={true}
                                  comment="You're in the same class! Sit together! 👯‍♂️"
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Case 2: Conflict -> Render Warning Strip (Interactive, No Text)
                      if (conflict) {
                        return (
                          <div
                            key={conflictId}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setSelectedConflictId(selectedConflictId === conflictId ? null : conflictId);
                            }}
                            className={`absolute inset-y-1 md:inset-y-2 rounded-lg p-1.5 md:p-2 border-2 border-dashed border-red-400 dark:border-red-500/50 flex flex-col justify-center items-center transition-all group/ghost
                              ${selectedConflictId === conflictId ? 'z-[60] bg-white dark:bg-slate-800' : 'z-20 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800'}
                              cursor-pointer`}
                            style={{
                              left: `${leftPerc}%`,
                              width: `${widthPerc}%`,
                              minWidth: '40px',
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.05) 10px, rgba(239, 68, 68, 0.05) 20px)'
                            }}
                          >
                            <div className="text-red-500 opacity-80 animate-pulse">
                              <AlertTriangle size={16} />
                            </div>

                            {/* Tooltip on Click */}
                            {conflictingSession && selectedConflictId === conflictId && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[250px] z-[100]" onClick={(e) => e.stopPropagation()}>
                                <ComparisonTooltip
                                  userSubject={conflict}
                                  friendSubject={subject}
                                  userSession={conflictingSession}
                                  friendSession={cls}
                                  isMatch={false}
                                  comment={getConflictComment(conflictingSession.start, conflictingSession.end, cls.start, cls.end)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Case 3: No Overlap -> Render Ghost Block (Neutral)
                      return (
                        <div
                          key={conflictId}
                          className="absolute inset-y-1 md:inset-y-2 rounded-lg p-1.5 md:p-2 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50 flex flex-col justify-center items-center text-center overflow-hidden leading-tight z-0 hover:z-20 transition-all hover:bg-white dark:hover:bg-slate-800"
                          style={{
                            left: `${leftPerc}%`,
                            width: `${widthPerc}%`,
                            minWidth: '40px',
                          }}
                        >
                          <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center opacity-60 grayscale">
                            <span className={`${blockNameClass} truncate w-full text-slate-500 dark:text-slate-400`} title={subject.name}>
                              {subject.name}
                            </span>
                            <span className={`${blockMetaClass} text-slate-400 dark:text-slate-500 truncate`}>
                              {/^(sec|section)\.?\s*/i.test(subject.section) ? '' : 'Sec '}{subject.section}
                            </span>
                            <span className="text-[7px] md:text-[8px] lg:text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider hidden sm:block">
                              FRIEND
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
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
    </div >
  );
}