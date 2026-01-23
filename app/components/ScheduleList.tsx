import React from 'react';
import { AlertCircle, Save } from 'lucide-react';
import ScheduleTable from './ScheduleTable';
import ExportMenu from './Export';
import { Subject, Theme } from '@/app/lib/types';
import { BRAND } from '@/app/lib/constants';
import { analyzeSchedule } from '@/app/lib/utils';

interface ScheduleListProps {
    schedules: Subject[][];
    onExportStart: (id: string) => void;
    onExportEnd: () => void;
    exportingId: string | null;
    onSave: (schedule: Subject[], index: number) => void;
    theme?: Theme;
}

export default function ScheduleList({ schedules, onExportStart, onExportEnd, exportingId, onSave, theme }: ScheduleListProps) {
    const calculateCredits = (schedule: Subject[]) => schedule.reduce((sum, s) => sum + (s.credits || 0), 0);

    if (schedules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No Schedules</h3>
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
                                        <ExportMenu
                                            elementId={`schedule-option-${idx}`}
                                            fileName={`schedule-option-${idx + 1}`}
                                            isExporting={exportingId === `schedule-option-${idx}`}
                                            onExportStart={onExportStart}
                                            onExportEnd={onExportEnd}
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
                                    <ExportMenu
                                        elementId={`schedule-option-${idx}`}
                                        fileName={`schedule-option-${idx + 1}`}
                                        isExporting={exportingId === `schedule-option-${idx}`}
                                        onExportStart={onExportStart}
                                        onExportEnd={onExportEnd}
                                    />
                                </div>
                            </div>
                        </div>

                        <ScheduleTable schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} theme={theme} />
                    </div>
                );
            })}
        </div>
    );
}
