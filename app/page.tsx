// app/page.tsx
"use client";

import React, { useState } from 'react';
import { Sparkles, Gem, Palette } from 'lucide-react';
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

// Hooks
import { useScheduleData } from './hooks/useScheduleData';
import { useScheduleGenerator } from './hooks/useScheduleGenerator';
import { useTokens } from './hooks/useTokens';
import { useTheme } from './hooks/useTheme';

// Types & Constants
import { FormSection, Subject } from './lib/types';
import { BRAND, PALETTE } from './lib/constants';

export default function Home() {
    const { data: session, status } = useSession();

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

    // AI & Filtering
    const [isThinking, setIsThinking] = useState(false);
    const [activeFilter, setActiveFilter] = useState<any>(null);

    // Token Management
    const { tokens, setTokens, handleClaimAdReward, handleBuyTokens, handleAiSubmit } = useTokens(session, status, subjects, persistData);

    // Theme Management
    const { purchasedThemes, activeTheme, activeThemeId, purchaseTheme, activateTheme, isThemePurchased } = useTheme(session, status, tokens, setTokens);

    // Schedule Generation
    const { generatedSchedules, groupedSubjects, calculateTotalActiveCredits } = useScheduleGenerator(subjects, isLoaded, activeFilter);

    // Handlers
    const handleLogout = () => {
        clearData();
        setTokens(0);
        signOut();
    };

    const startAdFlow = () => {
        if (status !== 'authenticated') {
            alert("Login to save tokens!");
            return;
        }
        setShowTokenModal(false);
        setShowAdOverlay(true);
    };

    const handleClaimAd = async () => {
        const result = await handleClaimAdReward();
        setShowAdOverlay(false);
        if (result.success) {
            alert("Success! +5 Tokens added.");
        } else {
            alert(result.error || "Failed to claim reward.");
        }
    };

    const handleBuyTokensWrapper = async (packageId: 'starter' | 'pro') => {
        const result = await handleBuyTokens(packageId);
        if (!result.success) {
            alert(result.error);
        }
    };

    const handleAiSubmitWrapper = async (prompt: string) => {
        setIsThinking(true);
        const response = await handleAiSubmit(prompt);

        if (response.success) {
            if (response.filter) {
                setActiveFilter(response.filter);
            }
            if (response.message) alert(response.message);
            setShowSmartGenModal(false);
        } else {
            alert(response.error || "AI could not understand request.");
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
        if (window.confirm(`Delete ${name}?`)) {
            persistData(subjects.filter(s => s.name !== name));
        }
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


    if (!isLoaded) return null;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8 font-sans">

            {/* --- MODALS & OVERLAYS --- */}
            {showAdOverlay && <AdOverlay onClose={() => setShowAdOverlay(false)} onClaim={handleClaimAd} />}
            {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}
            {showTokenModal && (
                <TokenModal
                    onClose={() => setShowTokenModal(false)}
                    onStartAdFlow={startAdFlow}
                    onBuyTokens={handleBuyTokensWrapper}
                    isAuthenticated={status === 'authenticated'}
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

            <div className="max-w-[1600px] mx-auto">

                {/* --- HEADER --- */}
                <Header
                    session={session}
                    status={status}
                    tokens={tokens}
                    saving={saving}
                    onLogin={() => signIn('google')}
                    onLogout={handleLogout}
                    onShowTokenModal={() => setShowTokenModal(true)}
                    onShowDonationModal={() => setShowDonationModal(true)}
                    onSavedSchedules={() => alert('Saved Schedules feature coming soon!')}
                />

                {/* Theme Button - Floating */}
                <button
                    onClick={() => setShowThemeModal(true)}
                    className="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
                    title="Change Theme"
                >
                    <Palette size={24} />
                </button>

                {/* --- CONTENT AREA --- */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* SIDEBAR / TOP BAR */}
                    <div className="w-full lg:w-[400px] flex-shrink-0 space-y-6">

                        {/* Smart AI Button */}
                        <div
                            onClick={() => setShowSmartGenModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-xl text-white cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-4 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Sparkles size={24} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Smart AI Scheduler</h3>
                                <p className="text-xs text-indigo-100 opacity-80">"I want Fridays off..."</p>
                            </div>
                            <div className="ml-auto bg-black/20 px-2 py-1 rounded text-[10px] font-bold">
                                5 <Gem size={8} className="inline" />
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
                                onReset={() => { if (window.confirm('Clear all?')) persistData([]) }}
                                onAddSubject={() => { setEditingName(null); setShowAddForm(!showAddForm); }}
                                theme={{
                                    cardBg: 'bg-white',
                                    cardBorder: 'border-slate-200'
                                }}
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
                            theme={activeTheme}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <Footer onShowDonationModal={() => setShowDonationModal(true)} />
            </div>
        </main>
    );
}