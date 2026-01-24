import { Subject } from './types';

// Helper to get next occurrence of a day (0=Sun, 1=Mon...)
const getNextDay = (dayIndex: number): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Start of today (Local Browser Time)

    const currentDay = d.getDay();
    let diff = dayIndex - currentDay;
    if (diff < 0) {
        diff += 7; // Next week
    }
    // If today is the day, we book it starting today.
    d.setDate(d.getDate() + diff);
    return d;
};

const dayMap: { [key: string]: number } = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

const icsDayMap: { [key: string]: string } = {
    'Sunday': 'SU', 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
    'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA'
};

export function generateIcsContent(schedule: Subject[], semesterWeeks = 16): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UniPlanner//Schedule Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    // Detect User's Timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    schedule.forEach(subject => {
        // Skip subjects with "No Scheduled Time" or missing data
        if (subject.noTime || !subject.classes || subject.classes.length === 0) return;

        subject.classes.forEach(cls => {
            const dayIdx = dayMap[cls.day];
            if (dayIdx === undefined) return;

            // 1. Calculate Date (Local)
            const targetDate = getNextDay(dayIdx);

            // 2. Parse Time (e.g., "09:30")
            const [startH, startM] = cls.start.split(':').map(Number);
            const [endH, endM] = cls.end.split(':').map(Number);

            // 3. Format with TZID: YYYYMMDDTHHMMSS
            const formatTime = (baseDate: Date, h: number, m: number) => {
                const year = baseDate.getFullYear();
                const month = (baseDate.getMonth() + 1).toString().padStart(2, '0');
                const day = baseDate.getDate().toString().padStart(2, '0');
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                return `${year}${month}${day}T${hour}${minute}00`;
            };

            lines.push('BEGIN:VEVENT');
            lines.push(`SUMMARY:${subject.name} (Sec ${subject.section})`);
            lines.push(`DESCRIPTION:Credits: ${subject.credits}`);
            // Use explicit TZID to lock the time to the user's current zone
            lines.push(`DTSTART;TZID=${userTimezone}:${formatTime(targetDate, startH, startM)}`);
            lines.push(`DTEND;TZID=${userTimezone}:${formatTime(targetDate, endH, endM)}`);
            lines.push(`RRULE:FREQ=WEEKLY;COUNT=${semesterWeeks};BYDAY=${icsDayMap[cls.day]}`);
            lines.push('END:VEVENT');
        });
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}
