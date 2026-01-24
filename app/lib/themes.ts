import { Theme } from './types';

export const THEMES: Theme[] = [
    // ========== FREE TIER ==========
    {
        id: 'classic-blue',
        name: 'Classic Blue',
        description: 'The original UniPlanner look',
        price: 0,
        tier: 'free',
        colors: {
            header: 'bg-slate-900 dark:bg-slate-800',
            headerText: 'text-white',
            accent: 'text-emerald-500',
            subjectPalette: [
                'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
                'bg-amber-500', 'bg-violet-500', 'bg-cyan-500',
                'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500'
            ]
        },
        preview: '/themes/classic-blue.png'
    },
    {
        id: 'sakura-pink',
        name: 'Sakura Pink',
        description: 'Cherry blossom serenity',
        price: 0,
        tier: 'free',
        colors: {
            header: 'bg-pink-900 dark:bg-pink-800',
            headerText: 'text-white',
            accent: 'text-rose-300',
            subjectPalette: [
                'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500',
                'bg-pink-400', 'bg-rose-400', 'bg-fuchsia-400',
                'bg-pink-600', 'bg-rose-600', 'bg-red-400', 'bg-pink-300'
            ]
        },
        preview: '/themes/sakura-pink.png'
    },
    {
        id: 'midnight-sky',
        name: 'Midnight Sky',
        description: 'Starlit darkness',
        price: 0,
        tier: 'free',
        colors: {
            header: 'bg-indigo-950 dark:bg-indigo-900',
            headerText: 'text-white',
            accent: 'text-yellow-300',
            subjectPalette: [
                'bg-indigo-600', 'bg-blue-600', 'bg-violet-600',
                'bg-indigo-500', 'bg-blue-500', 'bg-purple-600',
                'bg-indigo-700', 'bg-blue-700', 'bg-violet-500', 'bg-slate-600'
            ]
        },
        preview: '/themes/midnight-sky.png'
    },

    // ========== BASIC TIER (10 tokens) ==========
    {
        id: 'midnight-purple',
        name: 'Midnight Purple',
        description: 'Dark and mysterious elegance',
        price: 10,
        tier: 'basic',
        colors: {
            header: 'bg-purple-900 dark:bg-purple-800',
            headerText: 'text-white',
            accent: 'text-amber-400',
            subjectPalette: [
                'bg-purple-500', 'bg-violet-500', 'bg-fuchsia-500',
                'bg-purple-600', 'bg-violet-600', 'bg-indigo-500',
                'bg-purple-400', 'bg-violet-400', 'bg-fuchsia-400', 'bg-indigo-600'
            ]
        },
        preview: '/themes/midnight-purple.png'
    },
    {
        id: 'forest-green',
        name: 'Forest Green',
        description: 'Natural and calming vibes',
        price: 10,
        tier: 'basic',
        colors: {
            header: 'bg-emerald-900 dark:bg-emerald-800',
            headerText: 'text-white',
            accent: 'text-yellow-400',
            subjectPalette: [
                'bg-emerald-500', 'bg-green-500', 'bg-teal-500',
                'bg-emerald-600', 'bg-green-600', 'bg-teal-600',
                'bg-lime-500', 'bg-emerald-400', 'bg-green-400', 'bg-teal-400'
            ]
        },
        preview: '/themes/forest-green.png'
    },
    {
        id: 'sunset-orange',
        name: 'Sunset Orange',
        description: 'Warm and energetic atmosphere',
        price: 10,
        tier: 'basic',
        colors: {
            header: 'bg-orange-900 dark:bg-orange-800',
            headerText: 'text-white',
            accent: 'text-cyan-400',
            subjectPalette: [
                'bg-orange-500', 'bg-red-500', 'bg-amber-500',
                'bg-orange-600', 'bg-red-600', 'bg-rose-500',
                'bg-orange-400', 'bg-red-400', 'bg-amber-600', 'bg-rose-600'
            ]
        },
        preview: '/themes/sunset-orange.png'
    },
    {
        id: 'ocean-blue',
        name: 'Ocean Blue',
        description: 'Cool and professional serenity',
        price: 10,
        tier: 'basic',
        colors: {
            header: 'bg-blue-900 dark:bg-blue-800',
            headerText: 'text-white',
            accent: 'text-rose-400',
            subjectPalette: [
                'bg-blue-500', 'bg-cyan-500', 'bg-sky-500',
                'bg-blue-600', 'bg-cyan-600', 'bg-sky-600',
                'bg-blue-400', 'bg-cyan-400', 'bg-sky-400', 'bg-indigo-500'
            ]
        },
        preview: '/themes/ocean-blue.png'
    },
    {
        id: 'lava-flow',
        name: 'Lava Flow',
        description: 'Volcanic energy and power',
        price: 10,
        tier: 'basic',
        colors: {
            header: 'bg-gradient-to-r from-red-900 to-orange-900 dark:from-red-800 dark:to-orange-800',
            headerText: 'text-white',
            accent: 'text-yellow-400',
            subjectPalette: [
                'bg-red-600', 'bg-orange-600', 'bg-red-500',
                'bg-orange-500', 'bg-red-700', 'bg-orange-700',
                'bg-amber-600', 'bg-red-400', 'bg-orange-400', 'bg-yellow-600'
            ]
        },
        preview: '/themes/lava-flow.png'
    },

    // ========== PREMIUM TIER (20 tokens) ==========
    {
        id: 'rose-gold',
        name: 'Rose Gold',
        description: 'Luxurious and sophisticated',
        price: 20,
        tier: 'premium',
        colors: {
            header: 'bg-gradient-to-r from-rose-900 to-amber-900 dark:from-rose-800 dark:to-amber-800',
            headerText: 'text-white',
            accent: 'text-yellow-300',
            subjectPalette: [
                'bg-rose-400', 'bg-pink-400', 'bg-amber-400',
                'bg-rose-500', 'bg-pink-500', 'bg-orange-400',
                'bg-rose-300', 'bg-pink-300', 'bg-amber-300', 'bg-orange-300'
            ]
        },
        preview: '/themes/rose-gold.png'
    },
    {
        id: 'cyberpunk-neon',
        name: 'Cyberpunk Neon',
        description: 'Futuristic and bold',
        price: 20,
        tier: 'premium',
        colors: {
            header: 'bg-black dark:bg-slate-900',
            headerText: 'text-white',
            accent: 'text-lime-400',
            subjectPalette: [
                'bg-pink-500', 'bg-cyan-500', 'bg-purple-500',
                'bg-fuchsia-500', 'bg-cyan-400', 'bg-violet-500',
                'bg-pink-400', 'bg-cyan-600', 'bg-purple-400', 'bg-fuchsia-400'
            ]
        },
        preview: '/themes/cyberpunk-neon.png'
    },
    {
        id: 'pastel-dream',
        name: 'Pastel Dream',
        description: 'Soft and aesthetic',
        price: 20,
        tier: 'premium',
        colors: {
            header: 'bg-slate-800 dark:bg-slate-700',
            headerText: 'text-white',
            accent: 'text-rose-300',
            subjectPalette: [
                'bg-pink-300', 'bg-blue-300', 'bg-purple-300',
                'bg-rose-300', 'bg-sky-300', 'bg-violet-300',
                'bg-pink-200', 'bg-blue-200', 'bg-purple-200', 'bg-indigo-300'
            ]
        },
        preview: '/themes/pastel-dream.png'
    },
    {
        id: 'electric-storm',
        name: 'Electric Storm',
        description: 'Lightning strikes and thunder',
        price: 20,
        tier: 'premium',
        colors: {
            header: 'bg-gradient-to-r from-purple-950 to-blue-950',
            headerText: 'text-white',
            accent: 'text-yellow-300',
            subjectPalette: [
                'bg-yellow-400', 'bg-blue-600', 'bg-purple-600',
                'bg-yellow-500', 'bg-cyan-500', 'bg-violet-600',
                'bg-amber-400', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-600'
            ]
        },
        preview: '/themes/electric-storm.png'
    },

    // ========== ELITE TIER (30 tokens) ==========
    {
        id: 'aurora-borealis',
        name: 'Aurora Borealis',
        description: 'Magical and dynamic',
        price: 30,
        tier: 'elite',
        colors: {
            header: 'bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800',
            headerText: 'text-white',
            accent: 'text-cyan-300',
            subjectPalette: [
                'bg-purple-500', 'bg-blue-500', 'bg-green-400',
                'bg-pink-500', 'bg-indigo-500', 'bg-teal-400',
                'bg-violet-500', 'bg-cyan-500', 'bg-emerald-400', 'bg-fuchsia-500'
            ]
        },
        preview: '/themes/aurora-borealis.png'
    },
    {
        id: 'monochrome-elite',
        name: 'Monochrome Elite',
        description: 'Minimalist and timeless',
        price: 30,
        tier: 'elite',
        colors: {
            header: 'bg-black dark:bg-slate-900',
            headerText: 'text-white',
            accent: 'text-emerald-400',
            subjectPalette: [
                'bg-slate-700', 'bg-slate-600', 'bg-slate-500',
                'bg-gray-700', 'bg-gray-600', 'bg-gray-500',
                'bg-slate-800', 'bg-gray-800', 'bg-slate-400', 'bg-gray-400'
            ]
        },
        preview: '/themes/monochrome-elite.png'
    },
    {
        id: 'galaxy-dream',
        name: 'Galaxy Dream',
        description: 'Cosmic wonder and stardust',
        price: 30,
        tier: 'elite',
        colors: {
            header: 'bg-gradient-to-r from-purple-950 via-pink-900 to-blue-950 dark:from-purple-900 dark:via-pink-800 dark:to-blue-900',
            headerText: 'text-white',
            accent: 'text-pink-300',
            subjectPalette: [
                'bg-purple-600', 'bg-pink-600', 'bg-blue-600',
                'bg-fuchsia-600', 'bg-violet-600', 'bg-indigo-600',
                'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-cyan-600'
            ]
        },
        preview: '/themes/galaxy-dream.png'
    }
];

// Helper function to get theme by ID
export const getThemeById = (id: string): Theme | undefined => {
    return THEMES.find(theme => theme.id === id);
};

// Helper function to get default theme
export const getDefaultTheme = (): Theme => {
    return THEMES[0]; // Classic Blue
};
