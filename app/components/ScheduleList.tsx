import React from 'react';
import { AlertCircle, Save, Share } from 'lucide-react';
import ScheduleTable from './ScheduleTable';
import ExportMenu from './Export';
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
}

export default function ScheduleList({ schedules, onExportStart, onExportEnd, exportingId, onSave, theme, comparisonSchedule, conflicts, onShare }: ScheduleListProps) {
    const calculateCredits = (schedule: Subject[]) => schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

    if (schedules.length === 0) {
        if (conflicts && conflicts.length > 0) {
            return (
                <div className="bg-white rounded-[40px] border-2 border-red-100 p-8 shadow-sm">
                    <div className="flex flex-col items-center justify-center text-center mb-8">
                        <div className="bg-red-50 p-4 rounded-full mb-4">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Schedule Conflict Detected</h3>
                        <p className="text-slate-500 max-w-md">We couldn't generate any valid schedules because the following subjects have overlapping times:</p>
                    </div>

                    <div className="grid gap-4 max-w-2xl mx-auto">
                        {conflicts.map((conflict, idx) => (
                            <div key={idx} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4">
                                <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-100 mt-0.5">#{idx + 1}</span>
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                                        <span className="border-b-2 border-red-200">{conflict.subject1}</span>
                                        <span className="text-red-300 text-xs">vs</span>
                                        <span className="border-b-2 border-red-200">{conflict.subject2}</span>
                                    </div>
                                    <p className="text-xs text-red-600 font-medium bg-white/50 px-2 py-1 rounded inline-block">
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
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No Schedules Generated</h3>
                <p className="text-slate-400 text-sm mt-2">Try selecting subjects in the library</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {schedules.map((schedule, idx) => {
                const tags = analyzeSchedule(schedule);
                return (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>

                        {/* --- HEADER CONTAINER --- */}
                        <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-4 px-4 xl:px-0 xl:ml-4">

                            {/* Mobile Layout: Stacked */}
                            <div className="xl:hidden space-y-3">
                                {/* Row 1: Badges + Buttons */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`${BRAND.secondary} text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                                            Option #{idx + 1}
                                        </div>
                                        <div className={`text-xs font-bold ${BRAND.accent} ${BRAND.accentBg} px-3 py-1 rounded-full border ${BRAND.accentBorder} whitespace-nowrap`}>
                                            {calculateCredits(schedule)} Credits
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onSave(schedule, idx)}
                                            className="bg-white border border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <Save size={14} /> Save
                                        </button>
                                        <button
                                            onClick={() => onShare(schedule)}
                                            className="bg-white border border-slate-200 hover:border-indigo-600 text-slate-500 hover:text-indigo-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        >
                                            <Share size={14} /> Share
                                        </button>
                                        <ExportMenu
                                            elementId={`schedule-option-${idx}`}
                                            fileName={`schedule-option-${idx + 1}`}
                                            isExporting={exportingId === `schedule-option-${idx}`}
                                            onExportStart={onExportStart}
                                            onExportEnd={onExportEnd}
                                            scheduleData={schedule}
                                        />
                                    </div>
                                </div>
                                {/* Row 2: Tags */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mask-linear">
                                    {tags.map((tag, tIdx) => (
                                        <div key={tIdx} className={`px-2 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${tag.color} whitespace-nowrap`}>
                                            <tag.icon size={12} /> {tag.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop Layout: Single Row */}
                            <div className="hidden xl:flex items-center gap-3 w-full">
                                {/* Badges */}
                                <div className={`${BRAND.secondary} text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                                    Option #{idx + 1}
                                </div>
                                <div className={`text-xs font-bold ${BRAND.accent} ${BRAND.accentBg} px-3 py-1.5 rounded-full border ${BRAND.accentBorder} whitespace-nowrap`}>
                                    {calculateCredits(schedule)} Credits
                                </div>

                                {/* Tags */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {tags.map((tag, tIdx) => (
                                        <div key={tIdx} className={`px-2 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${tag.color} whitespace-nowrap`}>
                                            <tag.icon size={12} /> {tag.text}
                                        </div>
                                    ))}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => onSave(schedule, idx)}
                                        className="bg-white border border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <Save size={14} /> Save
                                    </button>
                                    <button
                                        onClick={() => onShare(schedule)}
                                        className="bg-white border border-slate-200 hover:border-indigo-600 text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <Share size={14} /> Share
                                    </button>
                                    <ExportMenu
                                        elementId={`schedule-option-${idx}`}
                                        fileName={`schedule-option-${idx + 1}`}
                                        isExporting={exportingId === `schedule-option-${idx}`}
                                        onExportStart={onExportStart}
                                        onExportEnd={onExportEnd}
                                        scheduleData={schedule}
                                    />
                                </div>
                            </div>
                        </div>

                        <ScheduleTable schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} theme={theme} comparisonSchedule={comparisonSchedule || undefined} />
                    </div>
                );
            })}
        </div>
    );
}
