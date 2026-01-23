import React, { useState } from 'react';
import { Menu, BookMarked, X } from 'lucide-react';

interface HamburgerMenuProps {
    onSavedSchedules: () => void;
}

export default function HamburgerMenu({ onSavedSchedules }: HamburgerMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 w-10 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Menu"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => {
                                onSavedSchedules();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                            <BookMarked size={18} className="text-indigo-500" />
                            Saved Schedules
                        </button>

                        {/* Future menu items can be added here */}
                    </div>
                </>
            )}
        </div>
    );
}
