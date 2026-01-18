import React from 'react';
import { Download, AlertCircle } from 'lucide-react';
import ScheduleTable from './ScheduleTable';
import { Subject, Theme } from '@/app/lib/types';
import { BRAND } from '@/app/lib/constants';
import { analyzeSchedule } from '@/app/lib/utils';

interface ScheduleListProps {
    schedules: Subject[][];
    onDownloadPDF: (index: number) => void;
    exportingId: string | null;
    theme?: Theme;
}

export default function ScheduleList({ schedules, onDownloadPDF, exportingId, theme }: ScheduleListProps) {
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
                                <button onClick={() => onDownloadPDF(idx)} disabled={exportingId !== null} className={`md:hidden bg-white border border-slate-200 hover:border-${BRAND.primary.replace('bg-', '')} text-slate-500 ${BRAND.primaryText.replace('text-', 'hover:text-')} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50`}>
                                    <Download size={14} /> PDF
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
                            <button onClick={() => onDownloadPDF(idx)} disabled={exportingId !== null} className={`hidden md:flex bg-white border border-slate-200 hover:border-${BRAND.primary.replace('bg-', '')} text-slate-500 ${BRAND.primaryText.replace('text-', 'hover:text-')} px-3 py-1 rounded-full text-xs font-bold items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50`}>
                                <Download size={14} /> {exportingId === `schedule-option-${idx}` ? 'Saving...' : 'PDF'}
                            </button>
                        </div>

                        <ScheduleTable schedule={schedule} id={`schedule-option-${idx}`} exporting={exportingId === `schedule-option-${idx}`} theme={theme} />
                    </div>
                );
            })}
        </div>
    );
}
