import React from 'react';
import { GraduationCap, LogIn, Gem, Coffee, Palette } from 'lucide-react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { BRAND } from '@/app/lib/constants';
import { stringToColor } from '@/app/lib/utils';
import { Theme } from '@/app/lib/types';
import HamburgerMenu from './HamburgerMenu';

interface HeaderProps {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    tokens: number;
    saving: boolean;
    onLogin: () => void;
    onLogout: () => void;
    onShowTokenModal: () => void;
    onShowDonationModal: () => void;
    onSavedSchedules: () => void;
    onShowThemeModal: () => void;
    activeTheme: Theme;
    onImportBackup: (file: File) => void;
}

export default function Header({
    session,
    status,
    tokens,
    saving,
    onLogin,
    onLogout,
    onShowTokenModal,
    onShowDonationModal,
    onSavedSchedules,
    onShowThemeModal,
    activeTheme,
    onImportBackup
}: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 group cursor-default">
                    <div className="relative">
                        <div className={`absolute inset-0 ${activeTheme.colors.header} blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity`}></div>
                        <GraduationCap className={`${activeTheme.colors.accent} relative z-10 transition-transform group-hover:rotate-12 duration-300`} size={32} />
                    </div>
                    <span className={`${activeTheme.colors.header} bg-clip-text text-transparent bg-center`}>
                        {BRAND.name}
                    </span>
                </h1>
            </div>

            {/* Header Controls */}
            <div className="flex w-full md:w-auto justify-between md:justify-end gap-3 items-center">

                {/* Left Group: Profile + Coffee */}
                <div className='flex gap-3 items-center'>
                    {status === 'loading' ? (
                        <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-sm border border-slate-200 animate-pulse w-48 h-12"></div>
                    ) : status === 'authenticated' ? (
                        <div className="flex items-center gap-3 bg-white p-1.5 pr-5 rounded-full shadow-md border border-slate-100 hover:shadow-lg transition-all hover:scale-[1.01] group/profile">
                            {session?.user?.image ? (
                                <div className="relative w-8 h-8 group-hover/profile:scale-110 transition-transform duration-300">
                                    <Image src={session.user.image} alt="User" fill className="rounded-full object-cover" sizes="32px" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs group-hover/profile:scale-110 transition-transform duration-300" style={{ backgroundColor: stringToColor(session?.user?.name || 'User') }}>
                                    {(session?.user?.name?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                            <div className="text-xs text-left">
                                <div className="font-bold text-slate-700 group-hover/profile:text-slate-900 transition-colors">{session?.user?.name}</div>
                                <div onClick={onShowTokenModal} className="font-bold text-[10px] cursor-pointer hover:underline flex items-center gap-1 group/tokens">
                                    <Gem size={10} className={`${activeTheme.colors.accent} group-hover/tokens:scale-110 transition-transform`} />
                                    <span className={`${activeTheme.colors.header} bg-clip-text text-transparent`}>
                                        {tokens} Tokens
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onLogin} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-shadow cursor-pointer">
                            <LogIn size={16} /> Login to Sync
                        </button>
                    )}

                    {/* COFFEE BUTTON */}
                    <button
                        onClick={onShowDonationModal}
                        className="flex-shrink-0 h-11 w-11 flex items-center justify-center bg-white hover:bg-yellow-50 text-slate-400 hover:text-yellow-500 border border-slate-200 hover:border-yellow-200 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                        title="Buy me a coffee"
                    >
                        <Coffee size={20} />
                    </button>

                    {/* THEME BUTTON */}
                    <button
                        onClick={onShowThemeModal}
                        className={`flex-shrink-0 h-11 w-11 flex items-center justify-center ${activeTheme.colors.header} ${activeTheme.colors.headerText} border border-slate-200 rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 hover:opacity-90 cursor-pointer`}
                        title="Change Theme"
                    >
                        <Palette size={20} />
                    </button>
                </div>

                {/* Right Group: Hamburger Menu */}
                <div className="flex items-center">
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                    <HamburgerMenu
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
