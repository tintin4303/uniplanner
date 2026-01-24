import React from 'react';
import { Coffee } from 'lucide-react';
import { BRAND } from '@/app/lib/constants';

interface FooterProps {
  onShowDonationModal: () => void;
}

export default function Footer({ onShowDonationModal }: FooterProps) {
  return (
    <footer className="mt-20 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 text-sm transition-colors">
      <p className="mb-3">&copy; {new Date().getFullYear()} {BRAND.name}. Built for students, by students.</p>
      <div className="flex justify-center items-center gap-4">
        <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</a>
        <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</a>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <button onClick={onShowDonationModal} className="inline-flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer">
          <Coffee size={14} className="text-yellow-500" /> Buy me a coffee
        </button>
      </div>
    </footer>
  );
}