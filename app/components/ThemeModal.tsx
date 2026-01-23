import React, { useState } from 'react';
import { Gem, Check, Lock, Palette, Layout, MousePointerClick, Type, XCircle, Sparkles } from 'lucide-react';
import { PALETTE } from '@/app/lib/constants';
import { useToast } from '../context/ToastContext';
import { Theme } from '@/app/lib/types';
import { THEMES } from '@/app/lib/themes';

interface ThemeModalProps {
    onClose: () => void;
    purchasedThemes: string[];
    activeThemeId: string;
    tokens: number;
    onPurchase: (themeId: string) => Promise<{ success: boolean; error?: string }>;
    onActivate: (themeId: string) => Promise<{ success: boolean; error?: string }>;
    isAuthenticated: boolean;
}

export default function ThemeModal({
    onClose,
    purchasedThemes,
    activeThemeId,
    tokens,
    onPurchase,
    onActivate,
    isAuthenticated
}: ThemeModalProps) {
    const [processing, setProcessing] = useState<string | null>(null);
    const { addToast } = useToast();

    const handlePurchase = async (themeId: string) => {
        setProcessing(themeId);
        const result = await onPurchase(themeId);
        setProcessing(null);
        if (result.success) {
            // Success logic usually handled via page refresh or context update, showing toast anyway
            addToast("Theme purchased!", 'success');
            // Auto-activate after purchase
            await onActivate(themeId);
        } else {
            addToast(result.error || 'Purchase failed', 'error');
        }
    };

    const handleActivate = async (themeId: string) => {
        setProcessing(themeId);
        const result = await onActivate(themeId);
        setProcessing(null);
        if (result.success) {
            addToast("Theme activated!", 'success');
        } else {
            addToast(result.error || 'Activation failed', 'error');
        }
    };

    const getTierBadge = (tier: Theme['tier']) => {
        const badges = {
            free: { text: 'FREE', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            basic: { text: 'BASIC', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            premium: { text: 'PREMIUM', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            elite: { text: 'ELITE', color: 'bg-amber-100 text-amber-700 border-amber-200' }
        };
        return badges[tier];
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl w-full animate-in zoom-in-95 duration-300 my-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Palette size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Theme Gallery</h2>
                            <p className="text-sm text-slate-500">Customize your schedule display</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Token Balance */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gem size={20} className="text-pink-500" />
                        <span className="font-bold text-slate-700">Your Balance:</span>
                    </div>
                    <span className="text-2xl font-black text-pink-600">{tokens} Tokens</span>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {THEMES.map((theme) => {
                        const isPurchased = purchasedThemes.includes(theme.id);
                        const isActive = activeThemeId === theme.id;
                        const tierBadge = getTierBadge(theme.tier);
                        const canAfford = tokens >= theme.price;

                        return (
                            <div
                                key={theme.id}
                                className={`border-2 rounded-2xl p-4 transition-all ${isActive
                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                {/* Theme Preview */}
                                <div className={`${theme.colors.header} rounded-xl p-3 mb-3 relative overflow-hidden`}>
                                    <div className="flex gap-1 mb-2">
                                        {theme.colors.subjectPalette.slice(0, 5).map((color, idx) => (
                                            <div key={idx} className={`${color} h-8 flex-1 rounded`}></div>
                                        ))}
                                    </div>
                                    <div className={`text-xs ${theme.colors.headerText} font-bold`}>{theme.name}</div>

                                    {/* Active Badge */}
                                    {isActive && (
                                        <div className="absolute top-2 right-2 bg-white text-indigo-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                                            <Check size={12} /> ACTIVE
                                        </div>
                                    )}
                                </div>

                                {/* Theme Info */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-800 text-sm">{theme.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierBadge.color}`}>
                                            {tierBadge.text}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{theme.description}</p>
                                </div>

                                {/* Action Button */}
                                {theme.price === 0 ? (
                                    // Free theme
                                    <button
                                        onClick={() => !isActive && handleActivate(theme.id)}
                                        disabled={isActive}
                                        className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${isActive
                                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 cursor-pointer'
                                            }`}
                                    >
                                        {isActive ? 'Active' : 'Activate'}
                                    </button>
                                ) : isPurchased ? (
                                    // Owned theme
                                    <button
                                        onClick={() => !isActive && handleActivate(theme.id)}
                                        disabled={isActive}
                                        className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${isActive
                                            ? 'bg-indigo-100 text-indigo-700 cursor-default'
                                            : 'bg-indigo-500 hover:bg-indigo-600 text-white active:scale-95 cursor-pointer'
                                            }`}
                                    >
                                        {isActive ? 'Active' : 'Activate'}
                                    </button>
                                ) : (
                                    // Not purchased
                                    <button
                                        onClick={() => handlePurchase(theme.id)}
                                        disabled={!isAuthenticated || !canAfford || processing === theme.id}
                                        className={`w-full py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!isAuthenticated || !canAfford
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : processing === theme.id
                                                ? 'bg-slate-300 text-slate-600 cursor-wait'
                                                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white active:scale-95 cursor-pointer'
                                            }`}
                                    >
                                        {!isAuthenticated ? (
                                            <>
                                                <Lock size={14} /> Login Required
                                            </>
                                        ) : !canAfford ? (
                                            <>
                                                <Lock size={14} /> {theme.price} Tokens
                                            </>
                                        ) : processing === theme.id ? (
                                            'Purchasing...'
                                        ) : (
                                            <>
                                                <Gem size={14} /> Buy for {theme.price}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Tip */}
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                    <Sparkles size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                        <strong className="text-slate-800">Pro Tip:</strong> Themes are permanent once purchased!
                        {!isAuthenticated && ' Login to save your purchases across devices.'}
                    </div>
                </div>
            </div>
        </div>
    );
}
