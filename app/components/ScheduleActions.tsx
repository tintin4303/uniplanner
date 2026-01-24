import React, { useState } from 'react';
import {
    Save, Share2, MoreHorizontal, FileText, Image as ImageIcon,
    FileJson, Calendar, Loader2, Flame, Wand2, User, Shield
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Subject } from '@/app/lib/types';

import { generateIcsContent } from '@/app/lib/ics';
import { useToast } from '../context/ToastContext';

interface ScheduleActionsProps {
    index: number; // 0-based index
    credits: number;
    tags: { icon: any; text: string; color: string }[];
    schedule: Subject[];
    onSave: () => void;
    onShare: () => void;
    elementId: string; // DOM ID to capture for image/pdf
    onExportStart: (id: string) => void;
    onExportEnd: () => void;
    onRoast: () => void;
    onVibeCheck: () => void;
    onSurvivalGuide: () => void;
}

export default function ScheduleActions({
    index,
    credits,
    tags,
    schedule,
    onSave,
    onShare,
    elementId,
    onExportStart,
    onExportEnd,
    onRoast,
    onVibeCheck,
    onSurvivalGuide
}: ScheduleActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { addToast } = useToast();

    const fileName = `schedule-option-${index + 1}`;

    // --- Export Logic (Migrated from Export.tsx) ---

    // 1. Image / PDF Export
    const handleExportMedia = async (type: 'pdf' | 'png') => {
        setIsOpen(false);
        setIsExporting(true);
        onExportStart(elementId);

        // Small delay to ensure UI updates (e.g. closing dropdown)
        setTimeout(async () => {
            const element = document.getElementById(elementId);
            if (element) {
                try {
                    // Force white background for capture
                    const dataUrl = await toPng(element, {
                        cacheBust: true,
                        pixelRatio: 3,
                        backgroundColor: '#ffffff',
                        width: 1920,
                        height: element.offsetHeight,
                        style: { transform: 'scale(1)', transformOrigin: 'top left' }
                    });

                    if (type === 'pdf') {
                        const imgProps = new jsPDF().getImageProperties(dataUrl);
                        const pdf = new jsPDF({
                            orientation: imgProps.width > imgProps.height ? 'l' : 'p',
                            unit: 'px',
                            format: [imgProps.width, imgProps.height]
                        });
                        pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
                        pdf.save(`${fileName}.pdf`);
                        addToast("Saved as PDF", 'success');
                    } else {
                        const link = document.createElement('a');
                        link.download = `${fileName}.png`;
                        link.href = dataUrl;
                        link.click();
                        addToast("Saved as Image", 'success');
                    }
                } catch (err) {
                    console.error("Export failed", err);
                    addToast("Failed to export media.", 'error');
                }
            }
            setIsExporting(false);
            onExportEnd();
        }, 100);
    };

    // 2. ICS Calendar Export
    const handleCalendarExport = () => {
        setIsOpen(false);
        if (!schedule) return;
        try {
            const icsContent = generateIcsContent(schedule);
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `${fileName}.ics`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            addToast("Calendar file downloaded!", 'success');
        } catch (e) {
            console.error(e);
            addToast("Failed to generate calendar file", 'error');
        }
    };

    // 3. Backup JSON Export
    const handleJsonExport = () => {
        setIsOpen(false);
        if (!schedule) return;

        const backup = {
            version: '1.0',
            type: 'uniplanner-backup',
            timestamp: new Date().toISOString(),
            data: schedule
        };

        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${fileName}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast("Backup file downloaded", 'success');
    };

    return (
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 px-1">

            {/* LEFT: Info & Tags */}
            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 whitespace-nowrap">
                        Option #{index + 1}
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                            {credits} Credits
                        </span>
                    </h3>
                </div>

                {/* Tags Scroll Area */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear pb-1">
                    {tags.map((tag, tIdx) => (
                        <div key={tIdx} className={`px-2 py-1 rounded-md text-[10px] font-bold border flex-shrink-0 flex items-center gap-1 ${tag.color} whitespace-nowrap`}>
                            <tag.icon size={12} /> {tag.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Actions Toolbar */}
            <div className="flex items-center gap-2 flex-shrink-0 self-start xl:self-center">
                {/* Primary: Save */}
                <button
                    onClick={onSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
                >
                    <Save size={16} /> Save
                </button>

                {/* AI Actions Menu */}
                <div className="relative">
                    <button
                        onClick={() => { setIsOpen(false); setIsAiOpen(!isAiOpen); }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ml-1"
                    >
                        <Wand2 size={20} className="text-purple-500" />
                    </button>

                    {/* AI Dropdown Content */}
                    {isAiOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsAiOpen(false)}></div>
                            <div className="absolute left-1/2 -translate-x-1/2 xl:translate-x-0 xl:left-auto xl:right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top mr-1">
                                <div className="p-1">
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Vibes</div>
                                    <button
                                        onClick={() => { setIsAiOpen(false); onRoast(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between rounded-lg transition-colors cursor-pointer group"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Flame size={16} className="text-orange-500 group-hover:scale-110 transition-transform" /> Roast My Schedule
                                        </span>
                                        <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                            2 Tokens
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => { setIsAiOpen(false); onVibeCheck(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between rounded-lg transition-colors cursor-pointer group"
                                    >
                                        <span className="flex items-center gap-3">
                                            <User size={16} className="text-purple-500 group-hover:scale-110 transition-transform" /> Vibe Check
                                        </span>
                                        <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                            2 Tokens
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => { setIsAiOpen(false); onSurvivalGuide(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between rounded-lg transition-colors cursor-pointer group"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Shield size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Survival Guide
                                        </span>
                                        <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                            2 Tokens
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Secondary: Menu Dropdown (Experts Only) */}
                <div className="relative">
                    <button
                        onClick={() => { setIsAiOpen(false); setIsOpen(!isOpen); }}
                        disabled={isExporting}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={20} />}
                    </button>

                    {/* Dropdown Content */}
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
                            <div className="absolute left-0 xl:left-auto xl:right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left xl:origin-top-right mr-1">
                                <div className="p-1">
                                    <button
                                        onClick={() => { setIsOpen(false); onShare(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Share2 size={16} className="text-indigo-500" /> Share Schedule
                                    </button>
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                <div className="p-1">
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Export As</div>
                                    <button
                                        onClick={() => handleExportMedia('png')}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <ImageIcon size={16} className="text-blue-500" /> Image (PNG)
                                    </button>
                                    <button
                                        onClick={() => handleExportMedia('pdf')}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <FileText size={16} className="text-red-500" /> Document (PDF)
                                    </button>
                                    <button
                                        onClick={handleCalendarExport}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Calendar size={16} className="text-purple-500" /> Calendar (.ics)
                                    </button>
                                    <button
                                        onClick={handleJsonExport}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <FileJson size={16} className="text-emerald-500" /> Backup File
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
