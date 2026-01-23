import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface SaveScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}

export default function SaveScheduleModal({ isOpen, onClose, onSave }: SaveScheduleModalProps) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please enter a schedule name');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await onSave(name.trim());
            setName('');
            onClose();
        } catch (err) {
            setError('Failed to save schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setName('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Save Schedule</h2>
                    <button onClick={handleClose} disabled={saving} className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-sm text-slate-600 mb-4">
                    Give your schedule a name so you can easily find it later.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Schedule Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="e.g. Fall 2024 Plan A"
                        disabled={saving}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        autoFocus
                    />
                    {error && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <X size={12} /> {error}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
