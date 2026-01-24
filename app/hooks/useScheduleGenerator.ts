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
        if (results.length === 0 && names.length > 0) {
            const deadlocks: { subject1: string; subject2: string; reason: string }[] = [];

            // Check for Pairwise Deadlocks
            for (let i = 0; i < names.length; i++) {
                for (let j = i + 1; j < names.length; j++) {
                    const nameA = names[i];
                    const nameB = names[j];
                    const sectionsA = grouped[nameA];
                    const sectionsB = grouped[nameB];

                    let hasAnyValidCombo = false;
                    let firstConflictReason = "";

                    // Try all combinations of A and B
                    for (const secA of sectionsA) {
                        for (const secB of sectionsB) {
                            let overlap = false;

                            // Check overlap for this pair
                            if (!secA.noTime && !secB.noTime) {
                                for (const c1 of secA.classes) {
                                    for (const c2 of secB.classes) {
                                        if (isOverlapping(c1, c2)) {
                                            overlap = true;
                                            if (!firstConflictReason) {
                                                firstConflictReason = `${c1.day} ${c1.start}-${c1.end} overlaps with ${c2.start}-${c2.end}`;
                                            }
                                            break;
                                        }
                                    }
                                    if (overlap) break;
                                }
                            }

                            if (!overlap) {
                                hasAnyValidCombo = true;
                                break;
                            }
                        }
                        if (hasAnyValidCombo) break;
                    }

                    if (!hasAnyValidCombo) {
                        deadlocks.push({
                            subject1: nameA,
                            subject2: nameB,
                            reason: firstConflictReason || "Complete time overlap"
                        });
                    }
                }
            }
            // Return empty results with attached metadata (using a hack or creating a new return signature)
            // Ideally we return an object, but hook returns named exports. I will attach to the hook return.
            // But I cannot modify 'generatedSchedules' return type easily here without breaking downstream types if I returned complex obj array.
            // Instead, I will export 'conflicts' from the hook separately.
        }

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

    // Re-calculate conflicts explicitly to return them
    const conflicts = useMemo(() => {
        if (!isLoaded) return [];
        const activeSubjects = subjects.filter(s => s.active);
        if (activeSubjects.length === 0) return [];

        const grouped: Record<string, Subject[]> = activeSubjects.reduce((acc, s) => {
            (acc[s.name] = acc[s.name] || []).push(s);
            return acc;
        }, {} as Record<string, Subject[]>);

        const names = Object.keys(grouped);
        const deadlocks: { subject1: string; subject2: string; reason: string }[] = [];

        const isOverlapping = (c1: any, c2: any) => {
            if (c1.day !== c2.day) return false;
            return Math.max(timeToMin(c1.start), timeToMin(c2.start)) < Math.min(timeToMin(c1.end), timeToMin(c2.end));
        };

        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const nameA = names[i];
                const nameB = names[j];
                const sectionsA = grouped[nameA];
                const sectionsB = grouped[nameB];

                let hasAnyValidCombo = false;
                let firstConflictReason = "";

                for (const secA of sectionsA) {
                    for (const secB of sectionsB) {
                        let overlap = false;
                        if (!secA.noTime && !secB.noTime) {
                            for (const c1 of secA.classes) {
                                for (const c2 of secB.classes) {
                                    if (isOverlapping(c1, c2)) {
                                        overlap = true;
                                        if (!firstConflictReason) firstConflictReason = `${c1.day} ${c1.start}-${c1.end} overlaps ${c2.start}-${c2.end}`;
                                        break;
                                    }
                                }
                                if (overlap) break;
                            }
                        }
                        if (!overlap) {
                            hasAnyValidCombo = true;
                            break;
                        }
                    }
                    if (hasAnyValidCombo) break;
                }

                if (!hasAnyValidCombo) {
                    deadlocks.push({
                        subject1: nameA,
                        subject2: nameB,
                        reason: firstConflictReason || "Implicit Conflict"
                    });
                }
            }
        }
        return deadlocks;
    }, [subjects, isLoaded]); // Using same dependencies roughly

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
        conflicts,
    };
}
