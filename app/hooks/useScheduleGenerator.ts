import { useMemo } from 'react';
import { Subject } from '@/app/lib/types';
import { timeToMin } from '@/app/lib/utils';

export function useScheduleGenerator(subjects: Subject[], isLoaded: boolean, activeFilter: any) {
    const groupedSubjects = useMemo(() => {
        const groups: Record<string, Subject[]> = {};
        subjects.forEach(s => { (groups[s.name] = groups[s.name] || []).push(s); });
        return groups;
    }, [subjects]);

    const generatedSchedules = useMemo(() => {
        if (!isLoaded) return [];
        const activeSubjects = subjects.filter(s => s.active);
        if (activeSubjects.length === 0) return [];

        const grouped: Record<string, Subject[]> = activeSubjects.reduce((acc, s) => {
            (acc[s.name] = acc[s.name] || []).push(s);
            return acc;
        }, {} as Record<string, Subject[]>);

        const names = Object.keys(grouped);
        const results: Subject[][] = [];

        const isOverlapping = (c1: any, c2: any) => {
            if (c1.day !== c2.day) return false;
            return Math.max(timeToMin(c1.start), timeToMin(c2.start)) < Math.min(timeToMin(c1.end), timeToMin(c2.end));
        };

        const hasConflict = (schedule: Subject[], newSubject: Subject) => {
            if (newSubject.noTime) return false;
            for (let existing of schedule) {
                if (existing.noTime) continue;
                for (let c1 of existing.classes) {
                    for (let c2 of newSubject.classes) {
                        if (isOverlapping(c1, c2)) return true;
                    }
                }
            }
            return false;
        };

        const buildSchedule = (index: number, currentSchedule: Subject[]) => {
            if (results.length >= 50) return;
            if (index === names.length) {
                results.push(currentSchedule);
                return;
            }
            const subjectName = names[index];
            const sections = grouped[subjectName];
            for (let section of sections) {
                if (!hasConflict(currentSchedule, section)) {
                    buildSchedule(index + 1, [...currentSchedule, section]);
                }
            }
        };

        buildSchedule(0, []);

        if (activeFilter) {
            return results.filter(sched => {
                let isValid = true;
                if (activeFilter.days_off && Array.isArray(activeFilter.days_off)) {
                    const hasForbiddenDay = sched.some(sub => sub.classes.some(cls => activeFilter.days_off.includes(cls.day)));
                    if (hasForbiddenDay) isValid = false;
                }
                if (isValid && activeFilter.start_time_after) {
                    const minTime = timeToMin(activeFilter.start_time_after);
                    const hasEarlyClass = sched.some(sub => sub.classes.some(cls => timeToMin(cls.start) < minTime));
                    if (hasEarlyClass) isValid = false;
                }
                if (isValid && activeFilter.end_time_before) {
                    const maxTime = timeToMin(activeFilter.end_time_before);
                    const hasLateClass = sched.some(sub => sub.classes.some(cls => timeToMin(cls.end) > maxTime));
                    if (hasLateClass) isValid = false;
                }
                if (isValid && activeFilter.same_day && Array.isArray(activeFilter.same_day) && activeFilter.same_day.length > 1) {
                    const targetSubjects = sched.filter(sub => activeFilter.same_day.some((targetName: string) => sub.name.toLowerCase().includes(targetName.toLowerCase())));
                    if (targetSubjects.length === activeFilter.same_day.length) {
                        const subjectDays = targetSubjects.map(sub => sub.classes.map(c => c.day));
                        const commonDays = subjectDays.reduce((a, b) => a.filter(c => b.includes(c)));
                        if (commonDays.length === 0) isValid = false;
                    }
                }
                return isValid;
            });
        }
        return results;
    }, [subjects, isLoaded, activeFilter]);

    const calculateTotalActiveCredits = () => {
        const activeNames = new Set();
        let total = 0;
        subjects.filter(s => s.active).forEach(s => {
            if (!activeNames.has(s.name)) {
                total += (s.credits || 0);
                activeNames.add(s.name);
            }
        });
        return total;
    };

    return {
        generatedSchedules,
        groupedSubjects,
        calculateTotalActiveCredits,
    };
}
