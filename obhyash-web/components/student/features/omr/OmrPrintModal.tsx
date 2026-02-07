'use client';

import React from 'react';
import { OmrSheet } from './OmrSheet';
import { ExamDetails } from '@/lib/types';
import { Printer, X, Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OmrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: ExamDetails;
  totalQuestions?: number;
}

export const OmrPrintModal: React.FC<OmrPrintModalProps> = ({
  isOpen,
  onClose,
  details,
  totalQuestions = 50,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        We use a custom DialogContent to allow full-screen-ish and print behavior.
        The 'no-print' class is critical to hide the close button and modal wrapper chrome during printing,
        but typically the modal *overlay* might get in the way. 
        Actually, for printing, we usually want to hide *everything* except a specific element.
        Global CSS @media print handles hiding body > * except the print-content.
        
        However, simpler approach with React Dialog:
        1. We render the OMR sheet inside the modal for preview.
        2. We utilize a separate portal or CSS class to handle the print view to ensure strictly A4.
        
        Better approach for this specific case:
        When printing, we rely on @media print styles.
        We add a 'print-only' class to the OmrSheet wrapper so it is the only thing visible.
      */}
      <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col bg-neutral-100 dark:bg-neutral-900 border-none no-print">
        {/* Modal Header */}
        <div className="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center shadow-sm z-10">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-rose-600" />
              OMR Sheet Preview
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Preview before printing. Use A4 paper size.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-bold hover:scale-[1.02] transition-transform shadow-md"
            >
              <Printer size={18} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-neutral-100 dark:bg-neutral-950">
          <div className="shadow-2xl print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0 print:z-[9999] print:m-0 bg-white origin-top scale-75 md:scale-100 transition-transform duration-200">
            {/* 
                We wrap OMR Sheet in a div that will be targeted by print media queries.
                In globals.css, we usually hide everything in print.
                We need to ensure this specific element is VISIBLE.
             */}
            <div className="print-content">
              <OmrSheet details={details} totalQuestions={totalQuestions} />
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 
        HIDDEN PRINT VERSION (Optional: if we want to print without opening modal, 
        but here user visually sees it. The above 'print-content' inside modal works 
        IF the modal is in the DOM. Since standard Dialog unmounts when closed, 
        it must be open to print.)
      */}
    </Dialog>
  );
};
