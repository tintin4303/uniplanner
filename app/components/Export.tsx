import React, { useState } from 'react';
import { Download, ChevronDown, FileText, Image as ImageIcon, FileJson, Calendar } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useToast } from '../context/ToastContext';
import { generateIcsContent } from '../lib/ics';

interface ExportProps {
  elementId: string;
  fileName: string;
  isExporting: boolean;
  onExportStart: (id: string) => void;
  onExportEnd: () => void;
  scheduleData?: any[];
}

export default function ExportMenu({ elementId, fileName, isExporting, onExportStart, onExportEnd, scheduleData }: ExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addToast } = useToast();

  const handleExport = async (type: 'pdf' | 'png') => {
    setIsOpen(false);
    onExportStart(elementId);

    // Small delay to ensure state updates (like removing shadow for print)
    setTimeout(async () => {
      const element = document.getElementById(elementId);
      if (element) {
        try {
          const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            width: 1920,
            height: element.offsetHeight
          });

          if (type === 'pdf') {
            const imgProps = new jsPDF().getImageProperties(dataUrl);
            const pdf = new jsPDF({
              orientation: imgProps.width > imgProps.height ? 'l' : 'p',
              unit: 'px',
              format: [imgProps.width, imgProps.height]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
            pdf.save(`${fileName}.pdf`);
          } else {
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = dataUrl;
            link.click();
          }
        } catch (err) {
          console.error("Export failed", err);
          addToast("Failed to export.", 'error');
        }
      }
      onExportEnd();
    }, 100);
  };

  const handleJsonExport = () => {
    if (!scheduleData) return;

    const backup = {
      version: '1.0',
      type: 'uniplanner-backup',
      timestamp: new Date().toISOString(),
      data: scheduleData
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${fileName}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  const handleCalendarExport = () => {
    if (!scheduleData) return;
    try {
      const icsContent = generateIcsContent(scheduleData);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `${fileName}.ics`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
      addToast("Calendar file downloaded!", 'success');
    } catch (e) {
      console.error(e);
      addToast("Failed to generate calendar file", 'error');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`bg-white border border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer`}
      >
        <Download size={14} /> {isExporting ? 'Saving...' : 'Export'} <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 cursor-pointer">
              <FileText size={14} className="text-red-500" /> Save as PDF
            </button>
            <button onClick={() => handleExport('png')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-50">
              <ImageIcon size={14} className="text-blue-500" /> Save as PNG
            </button>
            <button onClick={handleJsonExport} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-50">
              <FileJson size={14} className="text-emerald-500" /> Save as Backup File
            </button>
            <button onClick={handleCalendarExport} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <Calendar size={14} className="text-purple-500" /> Save to Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}