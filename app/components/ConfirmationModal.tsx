import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

export interface Action {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'danger' | 'outline' | 'secondary';
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    actions: Action[];
    variant?: 'danger' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    title,
    message,
    actions,
    variant = 'info'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Close Button (Absolute, keep fixed over image/header) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer z-10"
                >
                    <XCircle size={24} />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar text-center">
                    {/* Icon */}
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
                        }`}>
                        {variant === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-black text-slate-800 mb-2">{title}</h2>

                    {/* Message */}
                    <div className="text-sm text-slate-500 mb-8 leading-relaxed">
                        {message}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={action.onClick}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${action.variant === 'primary'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                    : action.variant === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                                        : action.variant === 'secondary'
                                            ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                                            : 'bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
