import React from 'react';
import { Coffee } from 'lucide-react';
import { BRAND } from '@/app/lib/constants';

interface FooterProps {
  onShowDonationModal: () => void;
}

export default function Footer({ onShowDonationModal }: FooterProps) {
  return (
    <footer className="mt-20 py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
      <p className="mb-3">&copy; {new Date().getFullYear()} {BRAND.name}. Built for students, by students.</p>
      <div className="flex justify-center items-center gap-4">
        <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
        <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
        <span className="text-slate-300">|</span>
        <button onClick={onShowDonationModal} className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-yellow-600 transition-colors">
          <Coffee size={14} className="text-yellow-500" /> Buy me a coffee
        </button>
      </div>
    </footer>
  );
}