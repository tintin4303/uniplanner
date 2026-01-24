// app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Gem } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

// Components
import AdOverlay from './components/AdOverlay';
import DonationModal from './components/DonationModal';
import TokenModal from './components/TokenModal';
import SmartAIModal from './components/SmartAIModal';
import ThemeModal from './components/ThemeModal';
import Header from './components/Header';
import AddSubjectForm from './components/AddSubjectForm';
import SubjectLibrary from './components/SubjectLibrary';
import ScheduleList from './components/ScheduleList';
import Footer from './components/Footer';
import SaveScheduleModal from './components/SaveScheduleModal';
import SavedSchedulesModal from './components/SavedSchedulesModal';
import ConfirmationModal, { Action } from './components/ConfirmationModal';

// Hooks
import { useScheduleData } from './hooks/useScheduleData';
import { useScheduleGenerator } from './hooks/useScheduleGenerator';
import { useTokens } from './hooks/useTokens';
import { useTheme } from './hooks/useTheme';
import { useToast } from './context/ToastContext';

// Types & Constants
import { FormSection, Subject } from './lib/types';
import { BRAND, PALETTE } from './lib/constants';

export default function Home() {
    const { data: session, status } = useSession();
    const { addToast } = useToast();

    // Data Management
    const { subjects, isLoaded, saving, persistData, clearData } = useScheduleData();

    // UI State
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingName, setEditingName] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);

    // Modal States
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [showSmartGenModal, setShowSmartGenModal] = useState(false);
    const [showAdOverlay, setShowAdOverlay] = useState(false);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showSavedSchedulesModal, setShowSavedSchedulesModal] = useState(false);
    const [scheduleToSave, setScheduleToSave] = useState<Subject[] | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        actions: Action[];
        variant?: 'danger' | 'info';
    } | null>(null);

    // AI & Filtering
    const [isThinking, setIsThinking] = useState(false);
    const [activeFilter, setActiveFilter] = useState<any>(null);
    const [comparisonSubjects, setComparisonSubjects] = useState<Subject[] | null>(null);

    // Token Management
    const { tokens, setTokens, handleClaimAdReward, handleBuyTokens, handleAiSubmit } = useTokens(session, status, subjects, persistData);

    // Theme Management
    const { purchasedThemes, activeTheme, activeThemeId, purchaseTheme, activateTheme, isThemePurchased } = useTheme(session, status, tokens, setTokens);

    // Schedule Generation
    const { generatedSchedules, groupedSubjects, calculateTotalActiveCredits, conflicts } = useScheduleGenerator(subjects, isLoaded, activeFilter);

    // Handlers
    const handleLogout = async () => {
        await signOut({ redirect: false });
        clearData();
        setTokens(0);
    };

    // Auto-Input Check
    useEffect(() => {
        if (!isLoaded) return; // Wait for user data to load to prevent overwriting/race conditions

        const pending = localStorage.getItem('pendingScheduleImport');
        if (pending) {
            try {
                const { action, data } = JSON.parse(pending);
                if (action === 'IMPORT_SHARED' && Array.isArray(data)) {
                    localStorage.removeItem('pendingScheduleImport');
                    handleLoadSchedule(data);
                    addToast("Shared schedule loaded! You can now merge or replace.", 'success');
                }
            } catch (e) {
                console.error("Import error", e);
            }
        }
    }, [isLoaded]); // Run when loading completes

    // Share Handler
    const handleShare = async (schedule: Subject[]) => {
        addToast("Creating shareable link...", 'info');
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduleData: schedule, name: "Shared Schedule" })
            });
            const data = await res.json();

            if (data.success) {
                const url = `${window.location.origin}/share/${data.id}`;
                await navigator.clipboard.writeText(url);
                addToast("Link copied to clipboard! 🔗", 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error(err);
            addToast("Failed to share schedule.", 'error');
        }
    };

    // Save Schedule Handlers
    const handleSaveSchedule = (schedule: Subject[], index: number) => {
        setScheduleToSave(schedule);
        setShowSaveModal(true);
    };

    const handleSaveScheduleSubmit = async (name: string) => {
        if (!scheduleToSave) return;

        try {
            const response = await fetch('/api/schedules/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, scheduleData: scheduleToSave })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save schedule');
            }

            addToast('Schedule saved successfully!', 'success');
            setShowSaveModal(false); // Close modal on success
        } catch (error) {
            console.error('Error saving schedule:', error);
            addToast(`Failed to save schedule: ${error instanceof Error ? error.message : String(error)}`, 'error');
            throw error;
        }
    };

    // Helper for Merging
    const performMerge = (newSubjects: Subject[]) => {
        const existingIds = new Set(subjects.map(s => s.id));
        const existingContentSignatures = new Set(subjects.map(s => `${s.name.toLowerCase()}-${s.section}`));

        const subjectsToAdd = newSubjects.filter(s => {
            const isIdDuplicate = existingIds.has(s.id);
            const isContentDuplicate = existingContentSignatures.has(`${s.name.toLowerCase()}-${s.section}`);
            return !isIdDuplicate && !isContentDuplicate;
        });

        if (subjectsToAdd.length === 0) {
            addToast('No new subjects added (all imported subjects exist).', 'info');
        } else {
            const mergedSubjects = [...subjects, ...subjectsToAdd];
            persistData(mergedSubjects);
            addToast(`Merged! Added ${subjectsToAdd.length} new subject(s).`, 'success');
        }
        setComparisonSubjects(null);
    };

    // Helper for Replacing
    const performReplace = (newSubjects: Subject[]) => {
        persistData(newSubjects);
        addToast(`Loaded! Replaced with ${newSubjects.length} subject(s).`, 'success');
        setComparisonSubjects(null);
    };

    const handleLoadSchedule = (scheduleData: Subject[]) => {
        // 1. Basic Schema Validation
        const validImportData = scheduleData.filter(s =>
            s && typeof s.name === 'string' &&
            (Array.isArray(s.classes) || s.noTime === true)
        );

        if (validImportData.length < scheduleData.length) {
            addToast(`Warning: ${scheduleData.length - validImportData.length} items skipped (invalid data).`, 'info');
        }

        if (validImportData.length === 0) {
            addToast("No valid subjects found in the imported file.", 'error');
            return;
        }

        setShowSavedSchedulesModal(false);

        // Check if user has existing subjects
        if (subjects.length > 0) {
            setConfirmation({
                isOpen: true,
                title: "Load Schedule Action",
                message: `You have ${subjects.length} subject(s) in your library. How would you like to load this schedule?`,
                actions: [
                    {
                        label: "Compare (Overlay)",
                        variant: 'secondary',
                        onClick: () => {
                            setComparisonSubjects(validImportData);
                            setConfirmation(null);
                            addToast("Comparison Mode Active. Review changes on the grid.", 'info');
                        }
                    },
                    {
                        label: "Merge",
                        variant: 'primary',
                        onClick: () => {
                            performMerge(validImportData);
                            setConfirmation(null);
                        }
                    },
                    {
                        label: "Replace",
                        variant: 'danger',
                        onClick: () => {
                            performReplace(validImportData);
                            setConfirmation(null);
                        }
                    },
                    {
                        label: "Cancel",
                        variant: 'outline',
                        onClick: () => setConfirmation(null)
                    }
                ]
            });
        } else {
            // No existing subjects, just load
            performReplace(validImportData);
        }
    };

    const startAdFlow = () => {
        if (status !== 'authenticated') {
            addToast("Login to save tokens!", 'info');
            return;
        }
        setShowTokenModal(false);
        setShowAdOverlay(true);
    };

    const handleClaimAd = async () => {
        const result = await handleClaimAdReward();
        setShowAdOverlay(false);
        if (result.success) {
            addToast("Success! +5 Tokens added.", 'success');
        } else {
            addToast(result.error || "Failed to claim reward.", 'error');
        }
    };

    const handleBuyTokensWrapper = async (packageId: 'starter' | 'pro') => {
        const result = await handleBuyTokens(packageId);
        if (!result.success) {
            addToast(result.error || "Purchase failed", 'error');
        }
    };

    const handleAiSubmitWrapper = async (prompt: string) => {
        setIsThinking(true);
        const response = await handleAiSubmit(prompt);

        if (response.success) {
            if (response.filter) {
                setActiveFilter(response.filter);
            }
            if (response.message) addToast(response.message, 'info');
            setShowSmartGenModal(false);
        } else {
            addToast(response.error || "AI could not understand request.", 'error');
            if (response.needsTokens) {
                setShowSmartGenModal(false);
                setShowTokenModal(true);
            }
        }
        setIsThinking(false);
    };

    const handleEdit = (name: string) => {
        setEditingName(name);
        setShowAddForm(true);
    };

    const toggleSection = (id: string) => {
        persistData(subjects.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const toggleSubjectGroup = (name: string, shouldActive: boolean) => {
        persistData(subjects.map(s => s.name === name ? { ...s, active: shouldActive } : s));
    };

    const deleteSubjectGroup = (name: string) => {
        setConfirmation({
            isOpen: true,
            title: "Delete Subject?",
            message: `Are you sure you want to delete all sections of "${name}"? This cannot be undone.`,
            variant: 'danger',
            actions: [
                {
                    label: "Delete",
                    variant: 'danger',
                    onClick: () => {
                        persistData(subjects.filter(s => s.name !== name));
                        setConfirmation(null);
                    }
                },
                {
                    label: "Cancel",
                    variant: 'outline',
                    onClick: () => setConfirmation(null)
                }
            ]
        });
    };

    const handleSaveSubject = (name: string, credits: number, sections: FormSection[]) => {
        const nameToRemove = editingName || name;
        let otherSubjects = subjects.filter(s => s.name !== nameToRemove);
        const existingColorSubject = subjects.find(s => s.name === nameToRemove);
        let colorToUse = existingColorSubject?.color || PALETTE[new Set(otherSubjects.map(s => s.name)).size % PALETTE.length];
        const newEntries: Subject[] = sections.map(sec => ({
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            section: sec.section,
            credits: credits,
            noTime: sec.noTime,
            classes: sec.classes,
            color: colorToUse!,
            active: true
        }));
        persistData([...otherSubjects, ...newEntries]);
        setShowAddForm(false);
        setEditingName(null);
    };

    const handleExportStart = (id: string) => {
        setExportingId(id);
    };

    const handleExportEnd = () => {
        setExportingId(null);
    };

    const handleImportBackup = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                // Simple validation
                if (!parsed.data || !Array.isArray(parsed.data)) {
                    throw new Error("Invalid backup format");
                }

                // Reuse existing load logic
                handleLoadSchedule(parsed.data);
            } catch (err) {
                console.error("Import failed", err);
                addToast("Failed to import. File might be corrupted.", 'error');
            }
        };
        reader.readAsText(file);
    };


    if (!isLoaded) return null;

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 font-sans transition-colors duration-300">

            {/* --- MODALS & OVERLAYS --- */}
            {showAdOverlay && <AdOverlay onClose={() => setShowAdOverlay(false)} onClaim={handleClaimAd} />}
            {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}
            {showTokenModal && (
                <TokenModal
                    onClose={() => setShowTokenModal(false)}
                    onStartAdFlow={startAdFlow}
                    onBuyTokens={handleBuyTokensWrapper}
                />
            )}
            {showSmartGenModal && (
                <SmartAIModal
                    onClose={() => setShowSmartGenModal(false)}
                    onSubmit={handleAiSubmitWrapper}
                    isThinking={isThinking}
                />
            )}
            {showThemeModal && (
                <ThemeModal
                    onClose={() => setShowThemeModal(false)}
                    purchasedThemes={purchasedThemes}
                    activeThemeId={activeThemeId}
                    tokens={tokens}
                    onPurchase={purchaseTheme}
                    onActivate={activateTheme}
                    isAuthenticated={status === 'authenticated'}
                />
            )}

            {/* --- ACTIVE FILTER BANNER --- */}
            {activeFilter && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-400" />
                            <span className="text-sm font-medium">AI Filter Active</span>
                        </div>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <button onClick={() => setActiveFilter(null)} className="text-xs text-slate-400 hover:text-white font-bold transition-colors">CLEAR</button>
                    </div>
                </div>
            )}

            {/* --- COMPARISON CONTROLS --- */}
            {comparisonSubjects && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 border-2 border-indigo-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse"></div>
                                <span className="font-black text-slate-800">Comparison Mode</span>
                            </div>
                            <p className="text-xs text-slate-500">Overlaying imported schedule (Ghost View)</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => performMerge(comparisonSubjects)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                            >
                                Merge
                            </button>
                            <button
                                onClick={() => performReplace(comparisonSubjects)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                            >
                                Replace
                            </button>
                            <button
                                onClick={() => setComparisonSubjects(null)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto">

                {/* --- HEADER --- */}
                <Header
                    session={session}
                    status={status}
                    saving={saving}
                    onLogin={() => signIn('google')}
                    onLogout={handleLogout}
                    onShowTokenModal={() => setShowTokenModal(true)}
                    onShowDonationModal={() => setShowDonationModal(true)}
                    onSavedSchedules={() => setShowSavedSchedulesModal(true)}
                    onShowThemeModal={() => setShowThemeModal(true)}
                    activeTheme={activeTheme}
                    onImportBackup={handleImportBackup}
                />


                {/* --- CONTENT AREA --- */}
                <div className="flex flex-col xl:flex-row gap-8 items-start">

                    {/* SIDEBAR / TOP BAR */}
                    <div className="w-full xl:w-[400px] flex-shrink-0 space-y-6">

                        {/* Smart AI Button */}
                        <div
                            onClick={() => setShowSmartGenModal(true)}
                            className={`${activeTheme.colors.header} p-4 rounded-2xl shadow-xl ${activeTheme.colors.headerText} cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-4 relative overflow-hidden group`}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Sparkles size={24} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Smart AI Scheduler</h3>
                                <p className="text-xs opacity-80">"I want Fridays off..."</p>
                            </div>
                            <div className="ml-auto flex flex-col items-end gap-1">
                                <div onClick={(e) => { e.stopPropagation(); setShowTokenModal(true); }} className="bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-colors border border-white/10">
                                    <Gem size={12} className="text-white" />
                                    <span>{tokens}</span>
                                </div>
                                <div className="text-[9px] font-medium opacity-60 px-1">
                                    Cost: 5
                                </div>
                            </div>
                        </div>

                        {/* Add Subject Form or Library */}
                        {showAddForm ? (
                            <AddSubjectForm
                                onSave={handleSaveSubject}
                                onCancel={() => { setShowAddForm(false); setEditingName(null); }}
                                initialName={editingName || undefined}
                                initialCredits={editingName ? subjects.find(s => s.name === editingName)?.credits : undefined}
                                initialSections={editingName ? subjects.filter(s => s.name === editingName) : undefined}
                            />
                        ) : (
                            <SubjectLibrary
                                subjects={subjects}
                                onToggleGroup={toggleSubjectGroup}
                                onToggleSection={toggleSection}
                                onEdit={handleEdit}
                                onDelete={deleteSubjectGroup}
                                onReset={() => {
                                    setConfirmation({
                                        isOpen: true,
                                        title: "Clear Library?",
                                        message: "Are you sure you want to delete ALL subjects from your library? This action cannot be undone.",
                                        variant: 'danger',
                                        actions: [
                                            {
                                                label: "Clear All",
                                                variant: 'danger',
                                                onClick: () => {
                                                    persistData([]);
                                                    setConfirmation(null);
                                                }
                                            },
                                            {
                                                label: "Cancel",
                                                variant: 'outline',
                                                onClick: () => setConfirmation(null)
                                            }
                                        ]
                                    });
                                }}
                                onAddSubject={() => { setEditingName(null); setShowAddForm(!showAddForm); }}
                                theme={activeTheme}
                                validSchedulesCount={generatedSchedules.length}
                            />
                        )}
                    </div>

                    {/* MAIN CONTENT - Generated Schedules */}
                    <div className="w-full flex-1 min-w-0">
                        <ScheduleList
                            schedules={generatedSchedules}
                            onExportStart={handleExportStart}
                            onExportEnd={handleExportEnd}
                            exportingId={exportingId}
                            onSave={handleSaveSchedule}
                            onShare={handleShare}
                            theme={activeTheme}
                            comparisonSchedule={comparisonSubjects}
                            conflicts={conflicts}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <Footer onShowDonationModal={() => setShowDonationModal(true)} />
            </div>

            {/* Save Schedule Modal */}
            <SaveScheduleModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSaveScheduleSubmit}
            />

            {/* Saved Schedules Modal */}
            <SavedSchedulesModal
                isOpen={showSavedSchedulesModal}
                onClose={() => setShowSavedSchedulesModal(false)}
                onLoad={handleLoadSchedule}
            />

            {/* Confirmation Modal */}
            {confirmation && (
                <ConfirmationModal
                    isOpen={confirmation.isOpen}
                    onClose={() => setConfirmation(null)}
                    title={confirmation.title}
                    message={confirmation.message}
                    actions={confirmation.actions}
                    variant={confirmation.variant}
                />
            )}
        </main>
    );
}