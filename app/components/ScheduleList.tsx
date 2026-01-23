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
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 px-4 md:px-0 md:ml-4">

                            {/* TOP ROW: Option + Credits + Mobile Export */}
                            <div className="flex items-center justify-between w-full md:w-auto gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`${BRAND.secondary} text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                                        Option #{idx + 1}
                                    </div>
                                    <div className={`text-xs font-bold ${BRAND.accent} ${BRAND.accentBg} px-3 py-1 rounded-full border ${BRAND.accentBorder} whitespace-nowrap`}>
                                        {calculateCredits(schedule)} Credits
                                    </div>
                                </div>

                                {/* Save & Export Buttons (Visible on Mobile Only here) */}
                                <div className="md:hidden flex gap-2">
                                    <button
                                        onClick={() => onSave(schedule, idx)}
                                        className="bg-white border border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
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

                            {/* TAGS ROW (Scrollable on Mobile) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 mask-linear">
                                {tags.map((tag, tIdx) => (
                                    <div key={tIdx} className={`px-2 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${tag.color} whitespace-nowrap`}>
                                        <tag.icon size={12} /> {tag.text}
                                    </div>
                                ))}
                            </div>

                            {/* Save & Export Buttons (Desktop Only) */}
                            <div className="hidden md:block flex-1 h-px bg-slate-200 mx-2"></div>
                            <div className="hidden md:flex gap-2">
                                <button
                                    onClick={() => onSave(schedule, idx)}
                                    className="bg-white border border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                                >
                                    <Save size={16} /> Save
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

                        <ScheduleTable schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} theme={theme} />
                    </div>
                );
            })}
        </div>
    );
}
