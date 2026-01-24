import React, { useState, useEffect } from 'react';
import { Menu, BookMarked, X, Gem, Upload, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HamburgerMenuProps {
    onSavedSchedules: () => void;
    onShowTokenModal: () => void;
    onImportBackup: (file: File) => void;
    onLogout: () => void;
}

export default function HamburgerMenu({ onSavedSchedules, onShowTokenModal, onImportBackup, onLogout }: HamburgerMenuProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Menu"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="py-2">
                            <button
                                onClick={() => {
                                    onSavedSchedules();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                <BookMarked size={18} className="text-indigo-500" />
                                Saved Schedules
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                <Upload size={18} className="text-emerald-500" />
                                Import Backup
                            </button>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                {mounted && theme === 'dark' ? (
                                    <Moon size={18} className="text-blue-400" />
                                ) : (
                                    <Sun size={18} className="text-orange-400" />
                                )}
                                {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 py-2 bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                                onClick={() => {
                                    onShowTokenModal();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                <Gem size={18} className="text-pink-500" />
                                Get More Tokens
                            </button>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>

                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    onImportBackup(file);
                                    setIsOpen(false);
                                }
                                // Reset value so same file can be selected again
                                if (e.target) e.target.value = '';
                            }}
                        />

                        {/* Future menu items can be added here */}
                    </div>
                </>
            )}
        </div>
    );
}
