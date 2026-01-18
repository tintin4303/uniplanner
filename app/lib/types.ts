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