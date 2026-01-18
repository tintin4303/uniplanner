import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Theme, UserThemes } from '@/app/lib/types';
import { THEMES, getThemeById, getDefaultTheme } from '@/app/lib/themes';

const THEME_CACHE_KEY = 'uniplan-active-theme';

export function useTheme(session: Session | null, status: string, tokens: number, setTokens: (tokens: number) => void) {
    const [purchasedThemes, setPurchasedThemes] = useState<string[]>(['classic-blue']);
    const [activeThemeId, setActiveThemeId] = useState<string>('classic-blue');
    const [activeTheme, setActiveTheme] = useState<Theme>(getDefaultTheme());

    // Fetch user's themes on mount
    useEffect(() => {
        async function fetchUserThemes() {
            if (status === 'authenticated') {
                try {
                    const res = await fetch('/api/themes/user');
                    if (res.ok) {
                        const data: UserThemes = await res.json();
                        setPurchasedThemes(data.purchased);
                        setActiveThemeId(data.active);
                        const theme = getThemeById(data.active);
                        if (theme) {
                            setActiveTheme(theme);
                            localStorage.setItem(THEME_CACHE_KEY, data.active);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch user themes', e);
                }
            } else {
                // Load from localStorage for unauthenticated users
                const cached = localStorage.getItem(THEME_CACHE_KEY);
                if (cached) {
                    const theme = getThemeById(cached);
                    if (theme && theme.price === 0) { // Only free themes for non-auth
                        setActiveThemeId(cached);
                        setActiveTheme(theme);
                    }
                }
            }
        }
        fetchUserThemes();
    }, [status]);

    const purchaseTheme = async (themeId: string): Promise<{ success: boolean; error?: string }> => {
        if (status !== 'authenticated') {
            return { success: false, error: 'Please login to purchase themes' };
        }

        const theme = getThemeById(themeId);
        if (!theme) {
            return { success: false, error: 'Theme not found' };
        }

        if (purchasedThemes.includes(themeId)) {
            return { success: false, error: 'Theme already purchased' };
        }

        if (tokens < theme.price) {
            return { success: false, error: 'Insufficient tokens' };
        }

        try {
            const res = await fetch('/api/themes/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setPurchasedThemes(data.purchasedThemes);
                setTokens(data.newBalance);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Purchase failed' };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    };

    const activateTheme = async (themeId: string): Promise<{ success: boolean; error?: string }> => {
        const theme = getThemeById(themeId);
        if (!theme) {
            return { success: false, error: 'Theme not found' };
        }

        // Check if user owns the theme
        if (!purchasedThemes.includes(themeId)) {
            return { success: false, error: 'Theme not purchased' };
        }

        // Update locally immediately for better UX
        setActiveThemeId(themeId);
        setActiveTheme(theme);
        localStorage.setItem(THEME_CACHE_KEY, themeId);

        // Sync with server if authenticated
        if (status === 'authenticated') {
            try {
                const res = await fetch('/api/themes/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ themeId })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    console.error('Failed to sync theme activation');
                }
            } catch (e) {
                console.error('Network error activating theme', e);
            }
        }

        return { success: true };
    };

    const isThemePurchased = (themeId: string): boolean => {
        return purchasedThemes.includes(themeId);
    };

    return {
        purchasedThemes,
        activeTheme,
        activeThemeId,
        purchaseTheme,
        activateTheme,
        isThemePurchased,
    };
}
