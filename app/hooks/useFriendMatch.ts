import { Subject, ClassSession } from '@/app/lib/types';
import { timeToMin } from '@/app/lib/utils'; // You might need to make timeToMin public or copy it

export function useFriendMatch() {

    const findCommonFreeTime = (mySchedule: Subject[], friendSchedule: Subject[]) => {
        // Simple logic to find 1-hour blocks where both are free
        // For now, returning empty to verify UI first
        return [];
    };

    const getConflictComment = (myStart: string, myEnd: string, friendStart: string, friendEnd: string): string => {
        const myStartMin = timeToMin(myStart);
        const myEndMin = timeToMin(myEnd);
        const frStartMin = timeToMin(friendStart);
        const frEndMin = timeToMin(friendEnd);

        // Check for "Morning Misery" (8 AM starts)
        if (myStartMin <= 480 && frStartMin <= 480) return "Both suffering in 8 AMs? Solidarity. ✊";

        // Logic for overlap type
        const overlapStart = Math.max(myStartMin, frStartMin);
        const overlapEnd = Math.min(myEndMin, frEndMin);
        if (overlapEnd < overlapStart) return "Time is an illusion... (Invalid overlap)"; // Should not happen with current logic

        const duration = overlapEnd - overlapStart;

        if (duration <= 15) return "Just a swift passing in the hallway! 🏃";
        if (duration >= 60) return "Total clash! Good luck seeing each other. 🚫";
        if (myEndMin > frEndMin) return "You're stuck in class while they leave... sad. 😢";
        if (frEndMin > myEndMin) return "You get to leave first! Flex on them. 💪";

        return "Classic conflict. Maybe text them?";
    };

    const calculateCompatibilityScore = (mySchedule: Subject[], friendSchedule: Subject[]) => {
        // 0-100 score
        // 100 = No Conflicts + Shared Lunch
        // 0 = Many Conflicts

        let score = 100;
        let conflicts = 0;

        // Naive conflict check
        // Ideally this reuses logic, but for now:
        const myClasses = mySchedule.filter(s => !s.noTime).flatMap(s => s.classes);
        const friendClasses = friendSchedule.filter(s => !s.noTime).flatMap(s => s.classes);

        // O(N*M) check - fine for small schedule
        for (const myCls of myClasses) {
            for (const frCls of friendClasses) {
                if (myCls.day !== frCls.day) continue;
                // Overlap formula: (StartA <= EndB) and (EndA >= StartB)
                // Using timeToMin helper (assuming it's available or we rewrite)
                /* 
                  We will assume exact string match for now to keep it simple or use helper 
                */
            }
        }

        return Math.max(0, score - (conflicts * 20)); // Arbitrary scoring
    };

    return {
        findCommonFreeTime,
        calculateCompatibilityScore,
        getConflictComment
    };
}
