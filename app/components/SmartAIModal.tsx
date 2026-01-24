import React, { useState, useEffect } from 'react';
import { XCircle, Sparkles, Zap, Clock, Gem } from 'lucide-react';

interface SmartAIModalProps {
    onClose: () => void;
    onSubmit: (prompt: string) => void;
    isThinking: boolean;
}

export default function SmartAIModal({ onClose, onSubmit, isThinking }: SmartAIModalProps) {
    const [aiPrompt, setAiPrompt] = useState("");

    // Rotating placeholder examples
    const placeholderExamples = [
        "Add Calculus on Monday at 9am",
        "Put Biology on TTh from 1 to 3",
        "Change Chemistry to Wednesday morning",
        "Move Physics to 2pm",
        "Make English 4 credits",
        "Remove History",
        "I don't want classes on Friday",
        "No classes before 10am",
        "Add another Math section on MWF afternoon"
    ];

    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = () => {
        if (aiPrompt.trim()) {
            onSubmit(aiPrompt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                {/* Header */}
                <div className="p-8 pb-4 shrink-0 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Sparkles className="text-indigo-500 fill-indigo-500" /> Smart AI
                        </h2>
                        <button onClick={onClose} className="cursor-pointer text-slate-300 hover:text-slate-500 transition-colors">
                            <XCircle />
                        </button>
                    </div>
                    <p className="text-slate-500 text-sm">Describe what you want in plain English. Our AI understands natural language!</p>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar relative z-10">
                    <textarea
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-40 mb-4"
                        placeholder={placeholderExamples[placeholderIndex]}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                    />

                    {/* Command hints */}
                    <div className="mb-4 text-[10px] text-slate-400 space-y-1">
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">➕ ADD</span>
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">🔄 UPDATE</span>
                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">❌ DELETE</span>
                            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">🎯 FILTER</span>
                        </div>
                    </div>
                </div>

                {/* Footer (Fixed) */}
                <div className="p-8 pt-4 shrink-0 relative z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">
                            Cost: <span className="text-pink-500">5 Tokens</span>
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={isThinking || !aiPrompt}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            {isThinking ? (
                                <>
                                    <Clock size={16} className="animate-spin" /> Thinking...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} className="fill-white" /> Generate
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
