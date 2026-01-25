'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { MathRenderer } from '@/components/math-renderer';
import { QuestionFormData } from '@/lib/types';

interface ReviewTableProps {
  data: QuestionFormData[];
  onEdit: (question: QuestionFormData, index: number) => void;
  onDelete: (index: number) => void;
}

export function ReviewTable({ data, onEdit, onDelete }: ReviewTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg bg-gray-50">
        <p className="text-muted-foreground">
          No questions to preview. Upload a file to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border h-[400px] overflow-auto shadow-inner bg-white">
      <Table>
        <TableHeader className="bg-slate-100 sticky top-0 z-20 shadow-sm">
          <TableRow>
            <TableHead className="w-[45%] p-4">Question</TableHead>
            <TableHead className="p-4">Subject & Chapter</TableHead>
            <TableHead className="p-4">Correct Answer</TableHead>
            <TableHead className="p-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((q, i) => (
            <TableRow
              key={i}
              className="hover:bg-slate-50 transition-colors border-b"
            >
              {/* Question Text Column */}
              <TableCell className="p-4 font-medium">
                <div className="max-h-24 overflow-hidden text-ellipsis">
                  <MathRenderer text={q.question} />
                </div>
              </TableCell>

              {/* Subject/Chapter Column */}
              <TableCell className="p-4">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                    {q.subject}
                  </span>
                  <span className="text-xs text-gray-500 italic truncate max-w-[150px]">
                    {q.chapter}
                  </span>
                </div>
              </TableCell>

              {/* ✅ FIXED: Logic to display correct option */}
              <TableCell className="p-4">
                <div className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded text-xs w-fit border border-emerald-100">
                  <MathRenderer
                    text={
                      q.options.find((opt) => opt.isCorrect)?.text ||
                      'No Correct Option'
                    }
                  />
                </div>
              </TableCell>

              {/* Actions Column */}
              <TableCell className="p-4 text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(q, i)}
                    title="Edit Question"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-red-50"
                    onClick={() => onDelete(i)}
                    title="Remove Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
