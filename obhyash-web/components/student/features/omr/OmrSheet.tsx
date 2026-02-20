import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { ExamDetails } from '@/lib/types';

interface OmrSheetProps {
  details: ExamDetails;
  totalQuestions?: number;
}

export const OmrSheet: React.FC<OmrSheetProps> = ({
  details,
  totalQuestions = 50,
}) => {
  const qrData = JSON.stringify({
    s: details.subjectLabel || details.subject,
    t: details.examType,
    m: details.totalMarks,
    q: totalQuestions,
  });

  return (
    <div className="w-[210mm] h-[297mm] mx-auto bg-white relative p-12 text-black font-sans leading-tight print:w-full print:h-full print:m-0 print:p-8 box-border overflow-hidden">
      {/* Corner Markers (Fiducials) */}
      <div className="absolute top-8 left-8 w-6 h-6 bg-black rounded-br-sm" />
      <div className="absolute top-8 right-8 w-6 h-6 bg-black rounded-bl-sm" />
      <div className="absolute bottom-8 left-8 w-6 h-6 bg-black rounded-tr-sm" />
      <div className="absolute bottom-8 right-8 w-6 h-6 bg-black rounded-tl-sm" />

      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 mt-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider m-0 leading-none">
            Obhyash Answer Sheet
          </h1>
          <p className="text-[10px] font-bold mt-1 text-neutral-800 uppercase font-mono">
            EXAM:{' '}
            <span className="underline decoration-1 underline-offset-2">
              {(details.subjectLabel || details.subject).substring(0, 25)}
            </span>{' '}
            &nbsp;|&nbsp; TYPE: {details.examType}
          </p>
        </div>
        <div className="border-2 border-black px-2 py-0.5 rounded text-lg font-black tracking-widest">
          OMR
        </div>
      </div>

      {/* Top Section: Info & Instructions */}
      <div className="flex gap-4 mb-5 h-40">
        {/* Student Info */}
        <div className="flex-1 border-[1.5px] border-black rounded p-3 flex flex-col justify-between">
          {['NAME', 'MOBILE', 'DATE', 'STUDENT ID'].map((label) => (
            <div key={label} className="flex items-end">
              <label className="text-[10px] font-bold w-16 uppercase pb-0.5">
                {label}
              </label>
              <div className="flex-1 border-b-[1.5px] border-dashed border-neutral-400 h-4 ml-1" />
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="w-[40%] border-[1.5px] border-black rounded p-2.5 bg-neutral-50 flex flex-col">
          <div className="text-[10px] font-extrabold uppercase border-b border-black pb-0.5 mb-1.5">
            Instructions
          </div>
          <ul className="list-none m-0 p-0 text-[9px] font-medium leading-normal space-y-0.5 pl-1">
            <li>
              • Use <strong>Black</strong> or <strong>Blue</strong> pen.
            </li>
            <li>• Darken circle completely.</li>
            <li>• No stray marks.</li>
            <li>• Multiple marks invalid.</li>
          </ul>

          <div className="mt-auto flex justify-between pt-2">
            <div>
              <span className="text-[8px] font-bold block mb-1">CORRECT</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-black" />
                <div className="w-3.5 h-3.5 rounded-full border border-black" />
                <div className="w-3.5 h-3.5 rounded-full border border-black" />
              </div>
            </div>
            <div>
              <span className="text-[8px] font-bold block mb-1">WRONG</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-full border border-black relative overflow-hidden flex items-center justify-center font-bold text-xs bg-white">
                  ×
                </div>
                <div className="w-3.5 h-3.5 rounded-full border border-black" />
                <div className="w-3.5 h-3.5 rounded-full border border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Sheet Body */}
      <div className="flex-1 border-2 border-black rounded p-3 relative flex justify-between">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-neutral-100 -rotate-45 select-none pointer-events-none z-0">
          OBHYASH
        </div>

        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="w-[23%] z-10 flex flex-col">
            {Array.from({ length: 25 }).map((_, row) => {
              const qNum = col * 25 + row + 1;
              const isVisible = qNum <= totalQuestions;

              return (
                <div
                  key={qNum}
                  className={cn(
                    'flex items-center justify-between mb-1 h-5',
                    !isVisible && 'opacity-20 grayscale',
                  )}
                >
                  <span className="font-mono text-[11px] font-bold w-6 text-right">
                    {qNum}
                  </span>
                  <div className="flex gap-1.5">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div
                        key={opt}
                        className="w-[18px] h-[18px] border-[1.2px] border-neutral-800 rounded-full flex items-center justify-center text-[8px] font-bold text-neutral-600"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-4 pt-1">
        <div className="w-[30%] text-center">
          <div className="border-t-[1.5px] border-black mb-1" />
          <div className="text-[9px] font-bold uppercase">
            Signature of Candidate
          </div>
        </div>

        <div className="border-[1.5px] border-black p-0.5 rounded flex flex-col items-center bg-white">
          <QRCodeSVG value={qrData} size={48} level="L" />
          <span className="text-[8px] font-extrabold font-mono mt-0.5">
            SCAN ME
          </span>
        </div>

        <div className="w-[30%] text-center">
          <div className="border-t-[1.5px] border-black mb-1" />
          <div className="text-[9px] font-bold uppercase">
            Signature of Invigilator
          </div>
        </div>
      </div>
    </div>
  );
};
