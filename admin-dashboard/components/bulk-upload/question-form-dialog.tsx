// File: components/bulk-upload/question-form-dialog.tsx
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
import { ImageUploader } from '@/components/ui/image-uploader';
import { Trash2, ImageIcon } from 'lucide-react'; // ✅ Added Icons

interface QuestionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  question?: QuestionFormData;
  onSubmit: (updatedQuestion: QuestionFormData) => Promise<boolean>;
}

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

export function QuestionFormDialog({
  isOpen,
  onOpenChange,
  question,
  onSubmit,
}: QuestionFormDialogProps) {
  // Default state structure to prevent null errors
  const [formData, setFormData] = useState<QuestionFormData>({
    stream: '',
    section: '',
    subject: '',
    chapter: '',
    topic: '',
    question: '',
    image_url: '', // Main Question Image
    options: [
      { id: 'a', text: '', isCorrect: false },
      { id: 'b', text: '', isCorrect: false },
      { id: 'c', text: '', isCorrect: false },
      { id: 'd', text: '', isCorrect: false },
    ],
    explanation: '',
    explanation_image_url: '', // ✅ Explanation Image
    difficulty: 'Medium',
    examType: '',
    institute: '',
    year: '',
    status: 'pending',
  });

  useEffect(() => {
    if (question) {
      setFormData(JSON.parse(JSON.stringify(question)));
    }
  }, [question]);

  if (!formData) return null;

  const handleUpdate = async () => {
    const success = await onSubmit(formData);
    if (success) {
      onOpenChange(false);
    }
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], text };
    setFormData({ ...formData, options: newOptions });
  };

  const setCorrectOption = (selectedId: string) => {
    const newOptions = formData.options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === selectedId,
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const currentCorrectId = formData.options.find((o) => o.isCorrect)?.id || '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-black bg-white">
        <DialogHeader>
          <DialogTitle>Edit Question Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* ✅ 1. Detailed Metadata Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">Stream</Label>
              <Input
                placeholder="e.g. HSC"
                value={formData.stream || ''}
                onChange={(e) =>
                  setFormData({ ...formData, stream: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">
                Section
              </Label>
              <Input
                placeholder="e.g. Science"
                value={formData.section || ''}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">
                Subject
              </Label>
              <Input
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">
                Chapter
              </Label>
              <Input
                value={formData.chapter}
                onChange={(e) =>
                  setFormData({ ...formData, chapter: e.target.value })
                }
              />
            </div>

            {/* Additional Metadata Row */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">Topic</Label>
              <Input
                value={formData.topic || ''}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">
                Difficulty
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(val) =>
                  setFormData({ ...formData, difficulty: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">
                Exam Type
              </Label>
              <Input
                placeholder="e.g. Final"
                value={formData.examType || ''}
                onChange={(e) =>
                  setFormData({ ...formData, examType: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase">Year</Label>
              <Input
                placeholder="e.g. 2024"
                value={formData.year || ''}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
              />
            </div>
          </div>

          {/* ✅ 2. Question Text & Image */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex justify-between items-end">
                <span>Question Text</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  LaTeX supported ($...$)
                </span>
              </Label>
              <Textarea
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                className="min-h-[100px] font-medium text-lg"
                placeholder="Type your question here..."
              />
              {/* Preview Box */}
              <div className="p-4 bg-slate-50 border rounded-md min-h-[60px]">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                  Preview
                </p>
                <div className="text-slate-800">
                  <MathRenderer
                    text={formData.question || 'Start typing to see preview...'}
                  />
                </div>
              </div>
            </div>

            {/* Image Uploader */}
            <div className="space-y-1">
              <Label>Question Image (Optional)</Label>
              <ImageUploader
                folder="questions"
                defaultValue={formData.image_url}
                onUploadComplete={(url) => {
                  setFormData({ ...formData, image_url: url });
                }}
              />
            </div>
          </div>

          {/* ✅ 3. Options with Image Uploads */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((opt, i) => (
                <div
                  key={opt.id || i}
                  className="p-3 border rounded-lg bg-slate-50/50 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Option {opt.id}
                      {opt.isCorrect && (
                        <span className="ml-2 text-emerald-600">(Correct)</span>
                      )}
                    </Label>
                  </div>

                  {/* Option Input + Image Uploader Row */}
                  <div className="flex gap-2 items-start">
                    {/* ID Badge */}
                    <div
                      className={`flex items-center justify-center w-8 h-10 rounded text-sm font-bold shrink-0 ${opt.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-slate-500'}`}
                    >
                      {opt.id}
                    </div>

                    {/* Text Input & Image Preview Container */}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                        className={
                          opt.isCorrect
                            ? 'border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-white'
                        }
                        placeholder={`Answer for option ${opt.id}`}
                      />

                      {/* ✅ Image Preview for Option */}
                      {opt.image_url && (
                        <div className="relative w-full h-20 rounded border overflow-hidden bg-slate-100 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={opt.image_url}
                            alt="Option"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newOpts = [...formData.options];
                              newOpts[i].image_url = undefined;
                              setFormData({ ...formData, options: newOpts });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* ✅ Compact Image Uploader Button */}
                    <div className="shrink-0 pt-1">
                      <ImageUploader
                        folder="options"
                        // variant="compact" // Uncomment if your component supports variants
                        onUploadComplete={(url) => {
                          const newOpts = [...formData.options];
                          newOpts[i].image_url = url;
                          setFormData({ ...formData, options: newOpts });
                        }}
                      />
                    </div>
                  </div>

                  {/* Latex Preview */}
                  {opt.text && (
                    <div className="pl-10">
                      <div className="text-xs bg-white px-2 py-1 rounded border text-slate-600 overflow-hidden text-ellipsis">
                        <MathRenderer text={opt.text} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ✅ 4. Answer Selection */}
          <div className="space-y-2 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <Label className="text-emerald-700 font-bold">
              Set Correct Answer
            </Label>
            <Select value={currentCorrectId} onValueChange={setCorrectOption}>
              <SelectTrigger className="bg-white border-emerald-200">
                <SelectValue placeholder="Select the correct option" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    <span className="font-bold mr-2 text-slate-500">
                      {opt.id.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[200px] inline-block align-bottom">
                      {opt.text || '(Empty)'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ✅ 5. Explanation with Image Upload */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Explanation / Solution</Label>
              {/* ✅ Compact Upload Button for Explanation */}
              <div className="scale-90 origin-right">
                <ImageUploader
                  folder="explanations"
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, explanation_image_url: url })
                  }
                />
              </div>
            </div>

            {/* ✅ Preview Explanation Image */}
            {formData.explanation_image_url && (
              <div className="w-full h-32 relative border rounded bg-slate-50 mb-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.explanation_image_url}
                  alt="Explanation"
                  className="w-full h-full object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      explanation_image_url: undefined,
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Textarea
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              placeholder="Provide solution steps using LaTeX..."
              className="min-h-[100px]"
            />
            {formData.explanation && (
              <div className="p-3 bg-slate-50 border rounded-md text-sm">
                <p className="text-[10px] text-slate-400 mb-1 uppercase">
                  Solution Preview
                </p>
                <MathRenderer text={formData.explanation} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 pb-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
