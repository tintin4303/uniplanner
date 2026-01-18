import React, { useState } from 'react';
import { XCircle, Sparkles, Zap, Clock, Gem } from 'lucide-react';

interface SmartAIModalProps {
    onClose: () => void;
    onSubmit: (prompt: string) => void;
    isThinking: boolean;
}

export default function SmartAIModal({ onClose, onSubmit, isThinking }: SmartAIModalProps) {
    const [aiPrompt, setAiPrompt] = useState("");

    const handleSubmit = () => {
        if (aiPrompt.trim()) {
            onSubmit(aiPrompt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-indigo-500 fill-indigo-500" /> Smart AI
                    </h2>
                    <button onClick={onClose}>
                        <XCircle className="text-slate-300 hover:text-slate-500 transition-colors" />
                    </button>
                </div>
                <p className="text-slate-500 text-sm mb-4">Describe your perfect schedule in plain English. Our AI will filter the options for you.</p>
                <textarea
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 mb-4"
                    placeholder="e.g., Add Python on Fridays 1pm to 4pm"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">
                        Cost: <span className="text-pink-500">5 Tokens</span>
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={isThinking || !aiPrompt}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
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
    );
}
