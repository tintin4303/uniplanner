import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Subject } from '@/app/lib/types';
import { saveScheduleToDB, loadScheduleFromDB } from '@/app/actions';

const CACHE_KEY = 'uniplan-local-cache-v1';

export function useScheduleData() {
    const { status } = useSession();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function initData() {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const migrated = parsed.map((s: any) => ({
                        ...s,
                        credits: typeof s.credits === 'number' ? s.credits : 3,
                        noTime: s.noTime ?? false
                    }));
                    setSubjects(migrated);
                    setIsLoaded(true);
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }

            if (status === 'authenticated') {
                try {
                    const dbData = await loadScheduleFromDB();
                    if (dbData && Array.isArray(dbData)) {
                        setSubjects(dbData);
                        localStorage.setItem(CACHE_KEY, JSON.stringify(dbData));
                    }
                } catch (e) {
                    console.error("DB Sync Error", e);
                }
            } else if (status === 'unauthenticated' && !cached) {
                const legacy = localStorage.getItem('next-scheduler-prod-v1');
                if (legacy) {
                    try {
                        setSubjects(JSON.parse(legacy));
                        localStorage.setItem(CACHE_KEY, legacy);
                    } catch (e) { }
                }
            }
            setIsLoaded(true);
        }
        initData();
    }, [status]);

    const persistData = async (newSubjects: Subject[]) => {
        setSubjects(newSubjects);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newSubjects));
        if (status === 'authenticated') {
            setSaving(true);
            try {
                await saveScheduleToDB(newSubjects);
            } catch (e) {
                console.error("Failed to sync to DB", e);
            }
            setSaving(false);
        }
    };

    const clearData = () => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('next-scheduler-prod-v1');
        setSubjects([]);
    };

    return {
        subjects,
        setSubjects,
        isLoaded,
        saving,
        persistData,
        clearData,
    };
}
