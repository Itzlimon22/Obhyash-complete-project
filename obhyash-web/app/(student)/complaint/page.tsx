'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Settings,
  AlertCircle,
  Zap,
  Bug,
  Smile,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { submitComplaint } from '@/services/complaint-service';
import { ComplaintType } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';

const COMPLAINT_TYPES = [
  {
    id: 'Technical' as ComplaintType,
    label: 'Technical Issue',
    icon: Zap,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Bugs, crashes, or loading problems',
  },
  {
    id: 'UX' as ComplaintType,
    label: 'User Experience',
    icon: Smile,
    color:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Interface suggestions or frustrations',
  },
  {
    id: 'Bug' as ComplaintType,
    label: 'Hidden Bug',
    icon: Bug,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    description: "Something isn't working correctly",
  },
  {
    id: 'Feature Request' as ComplaintType,
    label: 'New Idea',
    icon: AlertCircle,
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    description: "A feature you'd love to see",
  },
];

export default function ComplaintPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('Please select a complaint category');
      return;
    }
    if (description.length < 10) {
      toast.error('Please provide a bit more detail (min 10 characters)');
      return;
    }

    setIsLoading(true);
    const result = await submitComplaint(selectedType, description);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success(
        'We received your message! Thanks for helping us improve! 🚀',
      );
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } else {
      toast.error(result.error || 'Something went wrong. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="max-w-md w-full space-y-6">
          <div className="relative mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <div className="absolute inset-0 bg-emerald-400 opacity-20 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white">
            Message Received!
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Our team has been alerted! We'll look into it and notify you as soon
            as it's resolved. Redirecting you back to the dashboard...
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-emerald-600 font-bold"
          >
            Click here if not redirected
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-6 md:p-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="group -ml-3 text-neutral-500 hover:text-rose-600"
            >
              <ArrowLeft
                size={18}
                className="mr-2 group-hover:-translate-x-1 transition-transform"
              />
              Back
            </Button>
            <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white leading-tight">
              Something <span className="text-rose-600">Bugging</span> You? 🐛
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Tell us what's wrong or how we can make Obhyash better for you!
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center rotate-6 animate-pulse">
              <MessageSquare size={32} className="text-rose-600" />
            </div>
          </div>
        </div>

        {/* Complaint Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
              Select Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COMPLAINT_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-300 border-2 ${
                    selectedType === type.id
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/5 shadow-xl shadow-rose-500/10 scale-105'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-900/30'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                    <div
                      className={`p-3 rounded-xl ${type.color} group-hover:scale-110 transition-transform`}
                    >
                      <type.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white">
                        {type.label}
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
              Tell us more
            </h3>
            <div className="relative group">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be as detailed as possible... (e.g., 'The OMR scan button didn't react on my phone' or 'I think the font size is too small on the results page')"
                className="min-h-[200px] p-6 rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-lg focus:ring-rose-500 focus:border-rose-500 resize-none transition-all shadow-sm"
              />
              <div className="absolute top-4 right-4 text-neutral-300 group-focus-within:text-rose-400 transition-colors pointer-events-none">
                <Settings
                  className="animate-[spin_4s_linear_infinite]"
                  size={24}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative h-16 px-12 rounded-full bg-rose-600 hover:bg-rose-700 text-xl font-black text-white shadow-2xl shadow-rose-500/30 active:scale-95 transition-all w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <>
                  Send it to Admin!
                  <Send className="ml-3 group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>

        <footer className="text-center text-neutral-400 text-sm pt-12">
          Your feedback helps us make Obhyash better for thousands of students.
          ❤️
        </footer>
      </div>
    </div>
  );
}
