import React from 'react';
import { XCircle, Heart } from 'lucide-react';
import Image from "next/image";

interface DonationModalProps {
    onClose: () => void;
}

export default function DonationModal({ onClose }: DonationModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300 ease-out border border-slate-100 dark:border-slate-700">
                <div className="overflow-y-auto p-8 custom-scrollbar">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors z-10 cursor-pointer">
                        <XCircle size={24} />
                    </button>

                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shrink-0">
                        <Heart size={32} className="text-yellow-500 fill-yellow-500" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Buy me a Coffee</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Scan with any Thai Banking App to support the developer directly!</p>

                    <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner mb-6 inline-block hover:scale-105 transition-transform duration-300">
                        {/* Make sure qrcode.jpeg is in your public/ folder */}
                        <Image
                            src="/qrcode.jpeg"
                            alt="PromptPay QR"
                            width={192}
                            height={192}
                            className="object-contain mx-auto mix-blend-multiply"
                        />
                    </div>

                    <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                        Close
                    </button>
                    <p className="text-[10px] text-slate-400 mt-4">PromptPay / Thai QR Payment</p>
                </div>
            </div>
        </div>
    );
}