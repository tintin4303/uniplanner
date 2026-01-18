import { Sun, Moon, Zap, Coffee } from 'lucide-react';
import { Subject } from './types';

export const timeToMin = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minToTime = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + "00000".substring(0, 6 - c.length) + c;
};

export const analyzeSchedule = (schedule: Subject[]) => {
  const tags: { icon: any, text: string, color: string }[] = [];
  const activeDays = new Set<string>();
  let earliestStart = 24 * 60;
  let latestEnd = 0;

  const daySchedules: Record<string, { start: number, end: number }[]> = {};

  schedule.forEach(sub => {
    if (sub.noTime) return;
    sub.classes.forEach(cls => {
      activeDays.add(cls.day);
      const s = timeToMin(cls.start);
      const e = timeToMin(cls.end);
      if (s < earliestStart) earliestStart = s;
      if (e > latestEnd) latestEnd = e;

      if (!daySchedules[cls.day]) daySchedules[cls.day] = [];
      daySchedules[cls.day].push({ start: s, end: e });
    });
  });

  const workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const freeDays = workDays.filter(d => !activeDays.has(d));
  if (freeDays.length > 0) {
    if (freeDays.length <= 2) {
      freeDays.forEach(day => {
        tags.push({ icon: Sun, text: `${day} Off`, color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
      });
    } else {
      tags.push({ icon: Sun, text: `${freeDays.length} Days Off!`, color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
    }
  }

  if (earliestStart >= 600) {
    tags.push({ icon: Moon, text: "Sleep In (10am+)", color: "bg-indigo-100 text-indigo-700 border-indigo-200" });
  }

  if (latestEnd <= 840 && latestEnd > 0) {
    tags.push({ icon: Zap, text: "Done by 2pm", color: "bg-amber-100 text-amber-700 border-amber-200" });
  }

  let blockedLunchDays = 0;
  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60;

  Object.values(daySchedules).forEach(classes => {
    const isBusyAtLunch = classes.some(c =>
      (c.start <= lunchStart && c.end >= lunchEnd) ||
      (c.start > lunchStart && c.start < lunchEnd) ||
      (c.end > lunchStart && c.end < lunchEnd)
    );
    if (isBusyAtLunch) blockedLunchDays++;
  });

  if (blockedLunchDays === 0 && activeDays.size > 0) {
    tags.push({ icon: Coffee, text: "Lunch Free", color: "bg-orange-100 text-orange-700 border-orange-200" });
  }

  return tags;
};