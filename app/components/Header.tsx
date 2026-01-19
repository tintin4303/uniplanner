import React from 'react';
import { GraduationCap, LogIn, LogOut, Gem, Coffee } from 'lucide-react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { BRAND } from '@/app/lib/constants';
import { stringToColor } from '@/app/lib/utils';
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
    onSavedSchedules
}: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <GraduationCap className={BRAND.logoColor} size={32} /> {BRAND.name}
                </h1>
            </div>

            {/* Header Controls */}
            <div className="flex w-full md:w-auto justify-between md:justify-end gap-3 items-center">

                {/* Left Group: Profile + Coffee */}
                <div className='flex gap-3 items-center'>
                    {status === 'loading' ? (
                        <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-sm border border-slate-200 animate-pulse w-48 h-12"></div>
                    ) : status === 'authenticated' ? (
                        <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full shadow-sm border border-slate-200">
                            {session?.user?.image ? (
                                <div className="relative w-8 h-8">
                                    <Image src={session.user.image} alt="User" fill className="rounded-full object-cover" sizes="32px" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: stringToColor(session?.user?.name || 'User') }}>
                                    {(session?.user?.name?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                            <div className="text-xs text-left">
                                <div className="font-bold text-slate-700">{session?.user?.name}</div>
                                <div onClick={onShowTokenModal} className="text-pink-500 font-bold text-[10px] cursor-pointer hover:underline flex items-center gap-1">
                                    <Gem size={10} /> {tokens} Tokens
                                </div>
                            </div>
                            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 ml-2" title="Sign Out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={onLogin} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-shadow">
                            <LogIn size={16} /> Login to Sync
                        </button>
                    )}

                    {/* COFFEE BUTTON */}
                    <button
                        onClick={onShowDonationModal}
                        className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-white hover:bg-yellow-50 text-yellow-500 border border-slate-200 hover:border-yellow-200 rounded-full shadow-sm transition-all active:scale-95"
                        title="Buy me a coffee"
                    >
                        <Coffee size={20} />
                    </button>
                </div>

                {/* Right Group: Hamburger Menu */}
                <div className="flex items-center">
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                    <HamburgerMenu onSavedSchedules={onSavedSchedules} />
                </div>
            </div>
        </div>
    );
}
