import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Subject, Theme } from '@/app/lib/types';
import { getUserTokens, rewardTokens, generateAiAction } from '@/app/actions';
import { PALETTE } from '@/app/lib/constants';

export function useTokens(session: Session | null, status: string, subjects: Subject[], persistData: (subjects: Subject[]) => void, activeTheme?: Theme) {
    const [tokens, setTokens] = useState(0);

    useEffect(() => {
        async function fetchTokens() {
            if (status === 'authenticated') {
                try {
                    const balance = await getUserTokens();
                    setTokens(balance);
                } catch (e) {
                    console.error("Failed to fetch tokens", e);
                }
            }
        }
        fetchTokens();
    }, [status]);

    const handleClaimAdReward = async () => {
        const result = await rewardTokens();
        if (result.success && typeof result.newBalance === 'number') {
            setTokens(result.newBalance);
            return { success: true };
        } else {
            return { success: false, error: result.error || "Failed to claim reward." };
        }
    };

    const handleBuyTokens = async (packageId: 'starter' | 'pro') => {
        if (status !== 'authenticated') {
            return { success: false, error: "Please login first." };
        }
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
                return { success: true };
            }
            return { success: false, error: "Failed to initialize payment" };
        } catch (e) {
            return { success: false, error: "Payment failed to initialize" };
        }
    };

    const handleAiSubmit = async (aiPrompt: string, conflicts?: any[]): Promise<{ success: boolean; filter?: any; message?: string; error?: string; needsTokens?: boolean }> => {
        if (!aiPrompt.trim()) return { success: false, error: "Empty prompt" };

        const response = await generateAiAction(aiPrompt, subjects, conflicts);

        if (response.success && response.result) {
            const { action, data, message } = response.result;
            // Charge tokens immediately if operation succeeded
            if (typeof response.newBalance === 'number') setTokens(response.newBalance);

            if (action === "UNKNOWN") {
                return { success: false, error: message || "I'm not sure how to do that." };
            }

            let currentSubjects = [...subjects];
            let actionsWithMessage: string[] = [];
            let activeFilter = null;

            const normalizeDay = (d: string) => {
                const map: Record<string, string> = {
                    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
                    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
                };
                return map[d.toLowerCase()] || d;
            };

            const getColor = (idx: number) => {
                if (activeTheme && activeTheme.colors && activeTheme.colors.subjectPalette && activeTheme.colors.subjectPalette.length > 0) {
                    return activeTheme.colors.subjectPalette[idx % activeTheme.colors.subjectPalette.length];
                }
                return PALETTE[idx % PALETTE.length] || "bg-indigo-500";
            };

            const applyAction = (act: string, dt: any) => {
                if (act === "ADD") {
                    const newSubject: Subject = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: dt.name || "New Subject",
                        section: String(dt.section || "1"),
                        credits: Number(dt.credits || 3),
                        noTime: false,
                        active: true,
                        color: getColor(currentSubjects.length),
                        classes: (dt.classes && Array.isArray(dt.classes) && dt.classes.length > 0)
                            ? dt.classes.map((c: any) => ({ ...c, day: normalizeDay(c.day) }))
                            : [{ day: "Monday", start: "09:00", "end": "12:00" }]
                    };
                    currentSubjects = [...currentSubjects, newSubject];
                    actionsWithMessage.push(`Added "${newSubject.name}"`);
                }
                // ... (REMOVE, UPDATE, FILTER remain same) ...
                else if (act === "REMOVE") {
                    const targetName = dt.name.toLowerCase();
                    const filtered = currentSubjects.filter(s => !s.name.toLowerCase().includes(targetName));
                    if (filtered.length < currentSubjects.length) {
                        currentSubjects = filtered;
                        actionsWithMessage.push(`Removed "${dt.name}"`);
                    }
                }
                else if (act === "UPDATE") {
                    const targetName = dt.targetName.toLowerCase();
                    let found = false;
                    currentSubjects = currentSubjects.map(s => {
                        if (s.name.toLowerCase().includes(targetName)) {
                            found = true;
                            const updates = { ...dt.updates };
                            // Normalize days if classes are being updated
                            if (updates.classes && Array.isArray(updates.classes)) {
                                updates.classes = updates.classes.map((c: any) => ({ ...c, day: normalizeDay(c.day) }));
                            }
                            return { ...s, ...updates };
                        }
                        return s;
                    });
                    if (found) actionsWithMessage.push(`Updated "${dt.targetName}"`);
                }
                else if (act === "FILTER") {
                    activeFilter = dt;
                    actionsWithMessage.push("Applied filter");
                }
            };

            if (action === "BATCH" && data.actions && Array.isArray(data.actions)) {
                data.actions.forEach((subAction: any) => applyAction(subAction.action, subAction.data));
            } else {
                applyAction(action, data);
            }

            if (activeFilter) {
                return { success: true, filter: activeFilter, message: message || actionsWithMessage.join(", ") };
            }

            persistData(currentSubjects);
            return { success: true, message: message || actionsWithMessage.join(", ") };

        } else {
            return { success: false, error: response.error || "AI could not understand request.", needsTokens: response.error === "Insufficient tokens" };
        }
    };

    return {
        tokens,
        setTokens,
        handleClaimAdReward,
        handleBuyTokens,
        handleAiSubmit,
    };
}
