import React from 'react';
import { XCircle, Gem, PlayCircle, CreditCard } from 'lucide-react';

interface TokenModalProps {
    onClose: () => void;
    onStartAdFlow: () => void;
    onBuyTokens: (packageId: 'starter' | 'pack500' | 'pro') => void;
    isPro?: boolean;
}

export default function TokenModal({ onClose, onStartAdFlow, onBuyTokens, isPro = false }: TokenModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-700">

                {/* Header (Fixed) */}
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Gem className="text-pink-500 fill-pink-500" /> Get More Tokens
                        </h2>
                        <button onClick={onClose} className="cursor-pointer text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors">
                            <XCircle />
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-8 pt-2 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl text-center relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-[10px] font-bold px-2 py-1 rounded-bl-xl">FREE</div>
                            <PlayCircle size={32} className="mx-auto text-indigo-500 mb-2" />
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-300">Watch Ad</h3>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3">+5 Tokens</p>
                            <button onClick={onStartAdFlow} className="bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 w-full py-2 rounded-xl font-bold shadow-sm transition-all text-sm active:scale-95 cursor-pointer">Watch Now</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 shrink-0">
                            <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center opacity-80 hover:opacity-100 transition-opacity hover:shadow-md bg-white dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Starter Pack</h3>
                                <div className="text-2xl font-black text-slate-800 dark:text-white my-1">฿35</div>
                                <p className="text-xs text-slate-400 mb-3 font-bold">100 Tokens</p>
                                <button onClick={() => onBuyTokens('starter')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer">Buy</button>
                            </div>
                            <div className="border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl text-center shadow-md bg-indigo-50/50 dark:bg-indigo-900/20 hover:shadow-lg transition-shadow">
                                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Mega Pack</h3>
                                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 my-1">฿120</div>
                                <p className="text-xs text-indigo-500 mb-3 font-bold">500 Tokens</p>
                                <button onClick={() => onBuyTokens('pack500')} className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-200 w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer">Buy</button>
                            </div>
                        </div>

                        {/* Subscription Pack */}
                        <div className="shrink-0 mt-2">
                            <div className={`border-2 ${isPro ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-indigo-500 bg-white dark:bg-slate-800'} p-5 rounded-2xl text-center relative shadow-xl transform scale-100 md:scale-105 transition-transform ${isPro ? 'opacity-80' : 'hover:scale-105 md:hover:scale-110'}`}>
                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm ${isPro ? 'bg-emerald-500' : 'bg-gradient-to-r from-pink-500 to-indigo-500'}`}>{isPro ? 'ACTIVE' : 'BEST VALUE'}</div>
                                <h3 className={`font-black text-lg mt-1 ${isPro ? 'text-emerald-900 dark:text-emerald-300' : 'text-indigo-900 dark:text-white'}`}>Pro Subscription</h3>
                                <div className={`text-2xl font-black my-1 ${isPro ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>฿99 <span className="text-sm font-bold opacity-70">/ 30 days</span></div>
                                <p className={`text-xs mb-4 font-bold ${isPro ? 'text-emerald-500' : 'text-indigo-400'}`}>UNLIMITED AI FEATURES</p>
                                <button
                                    onClick={() => !isPro && onBuyTokens('pro')}
                                    disabled={isPro}
                                    className={`${isPro ? 'bg-emerald-200 text-emerald-800 cursor-not-allowed dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg animate-pulse cursor-pointer'} w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95`}
                                >
                                    {isPro ? 'Current Plan (Active)' : 'Subscribe Now'}
                                </button>
                            </div>
                        </div>
                        <div className="text-center shrink-0">
                            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                <CreditCard size={10} /> Secure payment via Stripe (PromptPay Supported)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
