import React, { useState, useEffect } from 'react';
import { XCircle, Gem, ExternalLink, CheckCircle } from 'lucide-react';
import { AD_URL } from '@/app/lib/constants';

interface AdOverlayProps {
    onClose: () => void;
    onClaim: () => void;
}

export default function AdOverlay({ onClose, onClaim }: AdOverlayProps) {
    const [step, setStep] = useState<'intro' | 'timer' | 'claim'>('intro');
    const [timeLeft, setTimeLeft] = useState(15);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'timer') {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setStep('claim');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleStartAd = () => {
        window.open(AD_URL, '_blank');
        setStep('timer');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300 ease-out">
                {step !== 'timer' && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer">
                        <XCircle size={24} />
                    </button>
                )}

                {step === 'intro' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Gem size={40} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Watch Ad to Earn</h2>
                        <p className="text-slate-500 dark:text-slate-400">Visit our sponsor for 15 seconds to recharge <strong>+5 Tokens</strong>.</p>
                        <button onClick={handleStartAd} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-xl">
                            <ExternalLink size={20} /> Visit Sponsor
                        </button>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Adsterra Secured</p>
                    </div>
                )}

                {step === 'timer' && (
                    <div className="space-y-6 py-8 animate-in fade-in duration-500">
                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#4f46e5" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * timeLeft) / 15} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                            </svg>
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{timeLeft}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Verifying...</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Please keep the ad tab open.</p>
                    </div>
                )}

                {step === 'claim' && (
                    <div className="space-y-6 animate-in zoom-in-75 duration-300">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Reward Unlocked!</h2>
                        <button onClick={onClaim} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg animate-pulse transition-all active:scale-95">
                            Claim +5 Tokens
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}