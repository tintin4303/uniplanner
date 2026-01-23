import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Trash2, Download } from 'lucide-react';
import { Subject } from '@/app/lib/types';

interface SavedSchedule {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface SavedSchedulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (scheduleData: Subject[]) => void;
}

export default function SavedSchedulesModal({ isOpen, onClose, onLoad }: SavedSchedulesModalProps) {
    const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSchedules();
        }
    }, [isOpen]);

    const fetchSchedules = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/schedules/saved');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch schedules');
            }

            setSchedules(data.schedules);
        } catch (err) {
            setError('Failed to load saved schedules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (id: string) => {
        setLoadingId(id);
        setError('');

        try {
            const response = await fetch(`/api/schedules/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load schedule');
            }

            onLoad(data.schedule.scheduleData);
            onClose();
        } catch (err) {
            setError('Failed to load schedule');
            console.error(err);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        setDeletingId(id);
        setError('');

        try {
            const response = await fetch(`/api/schedules/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete schedule');
            }

            // Remove from list
            setSchedules(schedules.filter(s => s.id !== id));
        } catch (err) {
            setError('Failed to delete schedule');
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">Saved Schedules</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-600">Loading schedules...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400 mb-2">No Saved Schedules</h3>
                            <p className="text-sm text-slate-500">Save a schedule to access it later</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {schedules.map((schedule) => (
                                <div key={schedule.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 mb-1">{schedule.name}</h3>
                                            <p className="text-xs text-slate-500">
                                                Saved {new Date(schedule.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleLoad(schedule.id)}
                                                disabled={loadingId === schedule.id || deletingId === schedule.id}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                {loadingId === schedule.id ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" /> Loading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download size={14} /> Load
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                disabled={deletingId === schedule.id || loadingId === schedule.id}
                                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingId === schedule.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
