import React, { useState, useEffect } from "react";
import LiveExamDetailsView from "./LiveExamDetailsView";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublishedLiveExams } from "@/services/live-exam-student-service";
import { LiveExam } from "@/lib/types";
import { toast } from "sonner";

export interface LiveExamCategoryViewProps {
  categoryTitle: string;
  onBack: () => void;
  onExamClick: (examId: string, status: "untaken" | "taken") => void;
}

const LiveExamCategoryView: React.FC<LiveExamCategoryViewProps> = ({
  categoryTitle,
  onBack,
  onExamClick,
}) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"All" | "Ongoing" | "Upcoming">("All");
  const [selectedExam, setSelectedExam] = useState<{ id: string; title: string; status: "untaken" | "taken" } | null>(null);
  const [exams, setExams] = useState<(LiveExam & { userAttemptStatus?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchExams();
    }
  }, [categoryTitle, user?.id]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const data = await getPublishedLiveExams(categoryTitle, user?.id);
      
      // Inject mock data for every category
      const mockExams: (LiveExam & { userAttemptStatus?: string })[] = [
        {
          id: `mock-untaken-${categoryTitle}`,
          category: categoryTitle,
          title: `[Mock] ${categoryTitle} - Untaken`,
          description: "This is a mock untaken exam for testing.",
          start_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // started yesterday
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // ends in 7 days
          duration_minutes: 45,
          total_marks: 50,
          negative_marking: 0.25,
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: "system",
          total_questions: 50,
          userAttemptStatus: undefined, // untaken
        },
        {
          id: `mock-taken-${categoryTitle}`,
          category: categoryTitle,
          title: `[Mock] ${categoryTitle} - Taken`,
          description: "This is a mock taken exam for testing.",
          start_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // started 2 days ago
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // ends in 7 days
          duration_minutes: 60,
          total_marks: 100,
          negative_marking: 0.25,
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: "system",
          total_questions: 100,
          userAttemptStatus: "submitted", // taken
        }
      ];
      
      setExams([...data, ...mockExams]);
    } catch (error) {
      toast.error("Failed to load live exams");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    // Search filter
    if (searchQuery && !exam.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    const isOngoing = now >= start && now <= end;
    const isUpcoming = now < start;

    if (activeFilter === "Ongoing" && !isOngoing) return false;
    if (activeFilter === "Upcoming" && !isUpcoming) return false;

    return true;
  });

  if (selectedExam) {
    return (
      <LiveExamDetailsView
        examId={selectedExam.id}
        examTitle={selectedExam.title}
        status={selectedExam.status}
        onBack={() => {
          setSelectedExam(null);
          fetchExams(); // Refresh to catch any attempt status changes
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 pt-4 md:pt-6 animate-in fade-in zoom-in-95 duration-300 min-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-neutral-800 dark:text-neutral-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {categoryTitle}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-neutral-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for exams..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-neutral-800 dark:text-neutral-200 shadow-sm"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Left Filters */}
          <div className="flex items-center bg-white dark:bg-neutral-800 rounded-full p-1 border border-neutral-200 dark:border-neutral-700 shadow-sm w-max">
            {["All", "Ongoing", "Upcoming"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-[#1d8a43] text-white shadow-md"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Routine
            </button>
            <button className="flex items-center justify-center bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 w-9 h-9 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-neutral-500 font-medium">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 font-medium">No live exams found for this category.</div>
          ) : (
            filteredExams.map((exam) => {
              const isTaken = exam.userAttemptStatus === "submitted";
              const now = new Date();
              const start = new Date(exam.start_time);
              const end = new Date(exam.end_time);
              let statusText = "Upcoming";
              let statusColor = "text-blue-600 dark:text-blue-400";
              let statusBg = "bg-blue-50 dark:bg-blue-900/20";

              if (now >= start && now <= end) {
                statusText = "Ongoing";
                statusColor = "text-[#2ca05a] dark:text-green-400";
                statusBg = "bg-[#ebfaef] dark:bg-green-900/20";
              } else if (now > end) {
                statusText = "Past";
                statusColor = "text-neutral-500 dark:text-neutral-400";
                statusBg = "bg-neutral-100 dark:bg-neutral-800";
              }

              // Calculate days left or since
              const msDiff = Math.abs(now.getTime() - start.getTime());
              const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
              const timeDisplay = now > start ? `${daysDiff} দিন আগে` : `বাকি - ${daysDiff} দিন`;

              return (
                <div 
                  key={exam.id}
                  onClick={() => setSelectedExam({ id: exam.id, title: exam.title, status: isTaken ? "taken" : "untaken" })}
                  className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                      {exam.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {exam.duration_minutes} মিনিট
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        {exam.total_questions} টি প্রশ্ন
                      </div>
                    </div>
                  </div>

                  <div className={`${statusBg} rounded-xl p-3 flex items-center justify-between mt-auto`}>
                    <div className={`flex items-center gap-1.5 ${statusColor} font-bold text-sm`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                      </svg>
                      {isTaken ? "Taken" : statusText}
                    </div>
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {timeDisplay}
                    </div>
                  </div>
                </div>
              );
            })
          )}
      </div>
    </div>
  );
};

export default LiveExamCategoryView;
