'use client';

import { useState, useEffect, useCallback } from 'react';
// ✅ New Import
import { createBrowserClient } from '@supabase/ssr';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Upload, Plus, FileText } from 'lucide-react';
import { MathRenderer } from '@/components/math-renderer';
import { QuestionFormData } from '@/lib/types';
import { hscSubjects } from '@/lib/data/hsc';

// Helper to debounce search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function QuestionsPage() {
  // ✅ New Client Initialization
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // ... Rest of your code remains exactly the same ...
  // (Paste the rest of the logic from the previous step here if needed, 
  //  but typically you just need to update the import and the const supabase line)

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  
  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchText, setSearchText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  const debouncedSearch = useDebounce(searchText, 500);

  // --- FETCH DATA ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Pagination limit

      // 1. Filter by Status Tab
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      // 2. Filter by Search Text
      if (debouncedSearch) {
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

      const { data, error } = await query;
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, selectedSubject, selectedDifficulty, supabase]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- UI COMPONENTS ---
  return (
    <div className="p-8 space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Questions</h1>
          <p className="text-slate-500">Browse, manage, and approve all questions in the database.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Template
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> Upload
          </Button>
          <Button className="bg-red-500 hover:bg-red-600 gap-2">
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
            className={`
              flex-1 px-6 py-2 text-sm font-medium rounded-md capitalize transition-all
              ${activeTab === tab 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
            `}
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
              <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
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
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead className="w-[40%]">Question</TableHead>
              <TableHead>Subject & Chapter</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                  No questions found for this status.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q, i) => (
                <TableRow key={q.id || i} className="hover:bg-slate-50">
                  <TableCell className="text-center text-slate-400 text-xs">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    <div className="max-h-[60px] overflow-hidden text-ellipsis line-clamp-2">
                       <MathRenderer text={q.question} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{q.subject}</span>
                      <span className="text-xs text-slate-500">{q.chapter}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.difficulty === 'Hard' ? 'destructive' : 'secondary'} className="capitalize">
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`
                        capitalize
                        ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        ${q.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                        ${q.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
                      `}
                    >
                      {q.status || 'pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
         <div>Showing top 50 results</div>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
         </div>
      </div>
    </div>
  );
}