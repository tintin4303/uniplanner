import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Subject } from '@/app/lib/types';
import { getUserTokens, rewardTokens, generateAiAction } from '@/app/actions';
import { PALETTE } from '@/app/lib/constants';

export function useTokens(session: Session | null, status: string, subjects: Subject[], persistData: (subjects: Subject[]) => void) {
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

    const handleAiSubmit = async (aiPrompt: string) => {
        if (!aiPrompt.trim()) return { success: false, error: "Empty prompt" };

        const response = await generateAiAction(aiPrompt, subjects);

        if (response.success && response.result) {
            const { action, data } = response.result;

            if (action === "ADD") {
                const newSubject: Subject = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: data.name || "New Subject",
                    section: data.section || "1",
                    credits: data.credits || 3,
                    noTime: false,
                    active: true,
                    color: PALETTE[subjects.length % PALETTE.length],
                    classes: (data.classes && Array.isArray(data.classes) && data.classes.length > 0)
                        ? data.classes
                        : [{ day: "Monday", start: "09:00", "end": "12:00" }]
                };
                const newSubjects = [...subjects, newSubject];
                persistData(newSubjects);
                if (typeof response.newBalance === 'number') setTokens(response.newBalance);
                return { success: true, message: `AI: Added "${newSubject.name}"` };
            }

            else if (action === "REMOVE") {
                const targetName = data.name.toLowerCase();
                const filtered = subjects.filter(s => !s.name.toLowerCase().includes(targetName));

                if (filtered.length === subjects.length) {
                    return { success: false, error: `AI: Could not find subject "${data.name}" to remove.` };
                } else {
                    persistData(filtered);
                    if (typeof response.newBalance === 'number') setTokens(response.newBalance);
                    return { success: true, message: `AI: Removed "${data.name}"` };
                }
            }

            else if (action === "UPDATE") {
                const targetName = data.targetName.toLowerCase();
                let found = false;
                const updated = subjects.map(s => {
                    if (s.name.toLowerCase().includes(targetName)) {
                        found = true;
                        return { ...s, ...data.updates };
                    }
                    return s;
                });

                if (found) {
                    persistData(updated);
                    if (typeof response.newBalance === 'number') setTokens(response.newBalance);
                    return { success: true, message: `AI: Updated "${data.targetName}"` };
                } else {
                    return { success: false, error: `AI: Could not find "${data.targetName}" to update.` };
                }
            }

            else if (action === "FILTER") {
                if (typeof response.newBalance === 'number') setTokens(response.newBalance);
                return { success: true, filter: data, message: "AI: Filter applied to generated schedules." };
            }

            if (typeof response.newBalance === 'number') setTokens(response.newBalance);
            return { success: true };
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
