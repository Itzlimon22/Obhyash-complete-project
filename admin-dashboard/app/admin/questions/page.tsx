'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs'; // ✅ Required: npm install exceljs
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // ✅ Added for selection
import {
  Loader2,
  Search,
  Upload,
  Plus,
  FileText,
  Trash2,
  FileQuestion,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { MathRenderer } from '@/components/math-renderer';
import { QuestionFormData } from '@/lib/types';
import { hscSubjects } from '@/lib/data/hsc';

// ✅ Import your Bulk Upload Dialog & Manual Form
import BulkUploadDialog from '@/components/bulk-upload/bulk-upload-dialog';
import { QuestionFormDialog } from '@/components/bulk-upload/question-form-dialog';

// Constants
const ITEMS_PER_PAGE = 20;

// Helper to debounce search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ✅ Supabase client initialized outside component to prevent infinite loops
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function QuestionsPage() {
  const { toast } = useToast();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const [searchText, setSearchText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const debouncedSearch = useDebounce(searchText, 500);

  // --- TEMPLATE GENERATOR ---
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions Template');

    worksheet.columns = [
      { header: 'stream', key: 'stream', width: 10 },
      { header: 'section', key: 'section', width: 10 },
      { header: 'subject', key: 'subject', width: 20 },
      { header: 'chapter', key: 'chapter', width: 20 },
      { header: 'topic', key: 'topic', width: 15 },
      { header: 'question', key: 'question', width: 40 },
      { header: 'option1', key: 'option1', width: 20 },
      { header: 'option2', key: 'option2', width: 20 },
      { header: 'option3', key: 'option3', width: 20 },
      { header: 'option4', key: 'option4', width: 20 },
      { header: 'answer', key: 'answer', width: 20 },
      { header: 'explanation', key: 'explanation', width: 30 },
      { header: 'difficulty', key: 'difficulty', width: 12 },
      { header: 'examType', key: 'examType', width: 15 },
      { header: 'institute', key: 'institute', width: 15 },
      { header: 'year', key: 'year', width: 10 },
    ];

    worksheet.addRow({
      stream: 'HSC',
      section: 'Science',
      subject: 'রসায়ন ১ম পত্র',
      chapter: 'ল্যাবরেটরীর নিরাপদ ব্যবহার',
      topic: 'ল্যাবরেটরি ব্যবহারের নিরাপত্তা বিধি',
      question: 'Sample Question with LaTeX $E=mc^2$',
      option1: 'Option A',
      option2: 'Option B',
      option3: 'Option C',
      option4: 'Option D',
      answer: 'Option A',
      explanation: 'Detailed solution steps here.',
      difficulty: 'Medium',
      examType: 'HSC,Admission',
      institute: 'BUET, Dhaka University',
      year: '2024',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'obhyash_upload_template.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  // --- FETCH DATA WITH PAGINATION ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const from = currentPage * 20;
      const to = from + 19;

      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // 1. Filter by Status
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      // 2. Filter by Search Text (Only if text exists)
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        query = query.textSearch('search_vector', debouncedSearch);
      }

      // 3. Filter by Subject
      if (selectedSubject !== 'all') {
        query = query.eq('subject_id', selectedSubject);
      }

      // 4. Filter by Difficulty
      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast({
        title: 'Fetch Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    // ✅ Added currentPage to the dependencies to stop the loop
  }, [
    activeTab,
    debouncedSearch,
    selectedSubject,
    selectedDifficulty,
    currentPage,
    toast,
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(0);
    setSelectedIds([]);
    // Ensure loading starts immediately when filters change
    setLoading(true);
  }, [activeTab, debouncedSearch, selectedSubject, selectedDifficulty]);
  // --- ACTIONS ---
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: newStatus })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Updated ${selectedIds.length} questions.`,
      });
      setSelectedIds([]);
      fetchQuestions();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const updateQuestionStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      if (activeTab !== 'all') {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, status: newStatus as any } : q,
          ),
        );
      }

      toast({
        title: 'Status Updated',
        description: `Question marked as ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this question?'))
      return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast({
        title: 'Deleted',
        description: 'Question removed successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-6 bg-gray-50/50 min-h-screen relative pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Questions
          </h1>
          <p className="text-slate-500">
            Manage {totalCount} questions in the database.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4" /> Template
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="w-4 h-4" /> Upload
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 gap-2"
            onClick={() => setIsAddOpen(true)} // ✅ This triggers the modal
          >
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex p-1 bg-slate-200/50 rounded-lg w-full md:w-fit">
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-6 py-2 text-sm font-medium rounded-md capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search question text..."
            className="pl-9"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {hscSubjects.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDifficulty}
          onValueChange={setSelectedDifficulty}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={
                    selectedIds.length === questions.length &&
                    questions.length > 0
                  }
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? questions.map((q) => q.id!) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-[40%]">Question</TableHead>
              <TableHead>Subject & Chapter</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading
                    questions...
                  </div>
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-60 text-center text-slate-500"
                >
                  <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>No questions found.</p>
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q, i) => (
                <TableRow
                  key={q.id || i}
                  className={
                    selectedIds.includes(q.id!)
                      ? 'bg-blue-50/30 transition-colors'
                      : 'hover:bg-slate-50 transition-colors'
                  }
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.includes(q.id!)}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) =>
                          checked
                            ? [...prev, q.id!]
                            : prev.filter((id) => id !== q.id),
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    <div className="max-h-[60px] overflow-hidden text-ellipsis line-clamp-2">
                      <MathRenderer text={q.question} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{q.subject}</span>
                      <span className="text-xs text-slate-500">
                        {q.chapter}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.difficulty === 'Hard' ? 'destructive' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : q.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {q.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {q.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 h-8"
                          onClick={() =>
                            updateQuestionStatus(q.id!, 'approved')
                          }
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 h-8 w-8 p-0"
                        onClick={() => deleteQuestion(q.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="flex items-center justify-between text-sm text-slate-500 bg-white p-4 border rounded-lg shadow-sm">
        <div>
          Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
          {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} of{' '}
          {totalCount} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FLOATING BULK ACTIONS */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedIds.length} items selected
          </span>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 h-8"
              onClick={() => handleBulkStatusUpdate('approved')}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 h-8"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isUploadOpen && (
        <BulkUploadDialog
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            fetchQuestions();
          }}
        />
      )}

      {isAddOpen && (
        <QuestionFormDialog
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          onSubmit={async (data) => {
            const { error } = await supabase.from('questions').insert([
              {
                ...data,
                status: 'approved',
                created_by: (await supabase.auth.getUser()).data.user?.id,
              },
            ]);

            if (!error) {
              fetchQuestions();
              setIsAddOpen(false);
              toast({ title: 'Success', description: 'Question created.' });
              return true;
            }

            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
            return false;
          }}
        />
      )}
    </div>
  );
}
