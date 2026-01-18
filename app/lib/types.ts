export interface ClassSession { day: string; start: string; end: string; }
export interface Subject {
  id: string;
  name: string;
  section: string;
  credits: number;
  noTime: boolean;
  classes: ClassSession[];
  color: string;
  active: boolean;
}
export interface FormSection { id: number; section: string; noTime: boolean; classes: ClassSession[]; }

export interface Theme {
  id: string;
  name: string;
  description: string;
  price: number; // in tokens
  tier: 'free' | 'basic' | 'premium' | 'elite';
  colors: {
    header: string; // Tailwind class
    headerText: string;
    accent: string;
    subjectPalette: string[]; // Array of Tailwind bg classes
  };
  preview: string; // Preview image path
}

export interface UserThemes {
  purchased: string[]; // Array of theme IDs
  active: string; // Currently active theme ID
}