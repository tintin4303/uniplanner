import React from 'react';
import { GraduationCap, LogIn, Palette } from 'lucide-react';
import { Session } from 'next-auth';
import { BRAND } from '@/app/lib/constants';
import { Theme } from '@/app/lib/types';
import HamburgerMenu from './HamburgerMenu';

interface HeaderProps {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    saving: boolean;
    onLogin: () => void;
    onLogout: () => void;
    onShowTokenModal: () => void;
    onShowDonationModal: () => void;
    onSavedSchedules: () => void;
    onShowThemeModal: () => void;
    activeTheme: Theme;
    onImportBackup: (file: File) => void;
    isPro?: boolean;
}

export default function Header({
    session,
    status,
    saving,
    onLogin,
    onLogout,
    onShowTokenModal,
    onShowDonationModal,
    onSavedSchedules,
    onShowThemeModal,
    activeTheme,
    onImportBackup,
    isPro = false
}: HeaderProps) {
    return (
        <div className="flex flex-row justify-between items-center mb-6 md:mb-10 gap-2 sm:gap-4 w-full bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="min-w-0 flex-shrink">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 cursor-default shrink min-w-0 text-slate-900 dark:text-white transition-transform hover:scale-[1.01]">
                    <GraduationCap className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${activeTheme.colors.accent} shrink-0`} />
                    <span className="truncate">
                        {BRAND.name}
                    </span>
                </h1>
            </div>

            {/* Header Controls */}
            <div className="flex flex-shrink-0 justify-end gap-2 sm:gap-3 items-center">

                {/* Left Group: Profile + Coffee */}
                <div className='flex gap-3 items-center'>
                    {status === 'loading' ? (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse w-48 h-12"></div>
                    ) : status === 'authenticated' ? (
                        null
                    ) : (
                        <button onClick={onLogin} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 sm:gap-2 hover:shadow-md transition-shadow cursor-pointer">
                            <LogIn size={16} /> <span className="hidden sm:inline">Login to Sync</span><span className="sm:hidden">Login</span>
                        </button>
                    )}

                    {/* COFFEE BUTTON (Hidden for now, planned for Patreon) */}
                    {/* <button
                        onClick={onShowDonationModal}
                        className="flex-shrink-0 h-11 w-11 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-slate-400 dark:text-slate-500 hover:text-yellow-500 border border-slate-200 dark:border-slate-800 hover:border-yellow-200 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                        title="Buy me a coffee"
                    >
                        <Coffee size={20} />
                    </button> */}

                    {/* THEME BUTTON */}
                    <button
                        onClick={onShowThemeModal}
                        className={`flex-shrink-0 h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center ${activeTheme.colors.header} ${activeTheme.colors.headerText} border border-slate-200 dark:border-slate-800 rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 hover:opacity-90 cursor-pointer`}
                        title="Change Theme"
                    >
                        <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Right Group: Hamburger Menu */}
                <div className="flex items-center">
                    <div className="h-6 sm:h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2 hidden xs:block"></div>
                    <HamburgerMenu
                        session={session}
                        isPro={isPro}
                        status={status}
                        onSavedSchedules={onSavedSchedules}
                        onShowTokenModal={onShowTokenModal}
                        onImportBackup={onImportBackup}
                        onLogout={onLogout}
                    />
                </div>
            </div>
        </div>
    );
}
