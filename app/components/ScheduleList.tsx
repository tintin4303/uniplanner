import React from 'react';
import { AlertCircle } from 'lucide-react';
import ScheduleTable from './ScheduleTable';
import ScheduleActions from './ScheduleActions';
import { Subject, Theme } from '@/app/lib/types';
import { BRAND } from '@/app/lib/constants';
import { analyzeSchedule } from '@/app/lib/utils';

// ... imports ...
// Assuming Conflict type
interface Conflict {
    subject1: string;
    subject2: string;
    reason: string;
}

interface ScheduleListProps {
    schedules: Subject[][];
    onExportStart: (id: string) => void;
    onExportEnd: () => void;
    exportingId: string | null;
    onSave: (schedule: Subject[], index: number) => void;
    theme?: Theme;
    comparisonSchedule?: Subject[] | null;
    conflicts?: Conflict[];
    onShare: (schedule: Subject[]) => void;
    onRoast: (schedule: Subject[]) => void;
    onVibeCheck: (schedule: Subject[]) => void;
    onSurvivalGuide: (schedule: Subject[]) => void;
    onFriendMatch?: (schedule: Subject[]) => void;
}

export default function ScheduleList({ schedules, onExportStart, onExportEnd, exportingId, onSave, theme, comparisonSchedule, conflicts, onShare, onRoast, onVibeCheck, onSurvivalGuide, onFriendMatch }: ScheduleListProps) {
    const calculateCredits = (schedule: Subject[]) => schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

    if (schedules.length === 0) {
        if (conflicts && conflicts.length > 0) {
            return (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border-2 border-red-100 dark:border-red-900/30 p-8 shadow-sm">
                    <div className="flex flex-col items-center justify-center text-center mb-8">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Schedule Conflict Detected</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">We couldn't generate any valid schedules because the following subjects have overlapping times:</p>
                    </div>

                    <div className="grid gap-4 max-w-2xl mx-auto">
                        {conflicts.map((conflict, idx) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-start gap-4">
                                <span className="bg-white dark:bg-slate-800 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-100 dark:border-red-900/30 mt-0.5">#{idx + 1}</span>
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                                        <span className="border-b-2 border-red-200 dark:border-red-800">{conflict.subject1}</span>
                                        <span className="text-red-300 text-xs">vs</span>
                                        <span className="border-b-2 border-red-200 dark:border-red-800">{conflict.subject2}</span>
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded inline-block">
                                        {conflict.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-400 dark:text-slate-600">No Schedules Generated</h3>
                <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">Try selecting subjects in the library</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {schedules.map((schedule, idx) => {
                const tags = analyzeSchedule(schedule);
                return (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>

                        <ScheduleActions
                            index={idx}
                            credits={calculateCredits(schedule)}
                            tags={tags}
                            schedule={schedule}
                            onSave={() => onSave(schedule, idx)}
                            onShare={() => onShare(schedule)}
                            elementId={`schedule-option-${idx}`}
                            onExportStart={onExportStart}
                            onExportEnd={onExportEnd}
                            onRoast={() => onRoast(schedule)}
                            onVibeCheck={() => onVibeCheck(schedule)}
                            onSurvivalGuide={() => onSurvivalGuide(schedule)}
                            onFriendMatch={() => { if (onFriendMatch) onFriendMatch(schedule); }}
                        />

                        <ScheduleTable schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} theme={theme} comparisonSchedule={comparisonSchedule || undefined} />
                    </div>
                );
            })}
        </div>
    );
}
