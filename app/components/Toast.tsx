import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

export default function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-emerald-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />
    };

    const styles = {
        success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        error: 'bg-red-50 border-red-100 text-red-900',
        info: 'bg-blue-50 border-blue-100 text-blue-900'
    };

    return (
        <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-top-5 fade-in duration-300 max-w-sm w-full ${styles[type]}`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
