import React from 'react';
import { Subject, ClassSession } from '@/app/lib/types';
import { Check } from 'lucide-react';

interface ComparisonTooltipProps {
    userSubject: Subject;
    friendSubject: Subject;
    userSession: ClassSession;
    friendSession: ClassSession;
    comment?: string;
    isMatch?: boolean;
}

export default function ComparisonTooltip({ userSubject, friendSubject, userSession, friendSession, comment, isMatch }: ComparisonTooltipProps) {
    return (
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className={`text-xs font-bold ${isMatch ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} uppercase tracking-wider flex items-center gap-1`}>
                    {isMatch ? <><Check size={14} strokeWidth={3} /> Match</> : '⚠ Conflict'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isMatch ? 'Same Class!' : 'Class Overlap'}
                </span>
            </div>

            <div className="space-y-2">
                <div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-0.5">Your Schedule</div>
                    <div className="font-bold text-sm leading-tight">{userSubject.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>{userSession.start} - {userSession.end}</span>
                        <span>Sec {userSubject.section}</span>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Friend's Schedule</div>
                    <div className="font-bold text-sm leading-tight">{friendSubject.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>{friendSession.start} - {friendSession.end}</span>
                        <span>Sec {friendSubject.section}</span>
                    </div>
                </div>

                {/* AI Comment / Vibe Check */}
                {comment && (
                    <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex gap-2 items-start">
                            <span className="text-sm">🤖</span>
                            <p className="text-xs italic text-slate-600 dark:text-slate-300 leading-snug">
                                "{comment}"
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-slate-900"></div>
        </div>
    );
}
