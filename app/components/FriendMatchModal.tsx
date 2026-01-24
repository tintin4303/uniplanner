import React, { useState } from 'react';
import { X, UserPlus, Search } from 'lucide-react';

interface FriendMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCompare: (friendId: string) => void;
}

export default function FriendMatchModal({ isOpen, onClose, onCompare }: FriendMatchModalProps) {
    const [friendId, setFriendId] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendId.trim()) return;

        setLoading(true);
        // Simulate API delay or validation
        setTimeout(() => {
            onCompare(friendId);
            setLoading(false);
            onClose();
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative scale-100 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Friend Match</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compare with a friend</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Friend's Share ID / Link</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={friendId}
                                onChange={(e) => setFriendId(e.target.value)}
                                placeholder="e.g. clr81..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                autoFocus
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Get your friend to click "Share" and send you their Code or URL.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!friendId.trim() || loading}
                            className="flex-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Searching...' : 'Compare Schedules'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
