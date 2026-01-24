'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionFormData } from '@/lib/types';
import { MathRenderer } from '@/components/math-renderer';

interface QuestionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  question?: QuestionFormData;
  onSubmit: (updatedQuestion: QuestionFormData) => Promise<boolean>;
}

export function QuestionFormDialog({
  isOpen,
  onOpenChange,
  question,
  onSubmit,
}: QuestionFormDialogProps) {
  // Use QuestionFormData type to resolve 'any' errors
  const [formData, setFormData] = useState<QuestionFormData | null>(null);

  useEffect(() => {
    if (question) {
      setFormData({ ...question });
    }
  }, [question]);

  if (!formData) return null;

  const handleUpdate = async () => {
    const success = await onSubmit(formData);
    if (success) {
      onOpenChange(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-black">
        <DialogHeader>
          <DialogTitle>Edit Question & Metadata</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Input
                value={formData.chapter}
                onChange={(e) =>
                  setFormData({ ...formData, chapter: e.target.value })
                }
              />
            </div>
          </div>

          {/* Question Input with LaTeX Preview */}
          <div className="space-y-2">
            <Label className="flex justify-between">
              Question Text
              <span className="text-xs text-blue-600">
                Supports Bangla & LaTeX ($...$)
              </span>
            </Label>
            <Textarea
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="min-h-[100px] font-medium"
            />
            <div className="p-3 bg-slate-50 border rounded-md text-sm">
              <p className="text-xs text-slate-400 mb-1 italic">Preview:</p>
              <MathRenderer text={formData.question} />
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.options.map((opt, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs">Option {i + 1}</Label>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Answer Selection */}
          <div className="space-y-2">
            <Label className="text-emerald-600 font-bold">
              Correct Answer Selection
            </Label>
            <Select
              value={formData.answer}
              onValueChange={(val) => setFormData({ ...formData, answer: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct option" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.map((opt, i) => (
                  <SelectItem key={i} value={opt}>
                    {opt || `Empty Option ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Explanation Section */}
          <div className="space-y-2">
            <Label>Explanation / Solution</Label>
            <Textarea
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              placeholder="Provide solution steps using LaTeX..."
            />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
