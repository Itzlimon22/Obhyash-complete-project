import React from "react";

export interface LiveExamDetailsViewProps {
  examId: string;
  examTitle: string;
  status: "untaken" | "taken";
  onBack: () => void;
}

const LiveExamDetailsView: React.FC<LiveExamDetailsViewProps> = ({
  examId,
  examTitle,
  status,
  onBack,
}) => {
  // Placeholder Data
  const schedule = {
    start: { date: "15 Sep 2025", time: "7:00 AM" },
    end: { date: "10 Sep 2026", time: "7:00 AM" },
  };
  const scheduleTaken = {
    start: { date: "8 Sep 2025", time: "7:00 AM" },
    end: { date: "3 Sep 2026", time: "7:00 AM" },
  };

  const currentSchedule = status === "taken" ? scheduleTaken : schedule;

  const previousAttempts = [
    { id: 1, attemptText: "প্রচেষ্টা ১", date: "8:08 PM 11 June 2026", score: 0 },
  ];

  const leaderboard = [
    { id: 1, name: "Md. Alif Salman", subtitle: "Notre Dame College, Dhaka", avatar: "https://i.pravatar.cc/150?u=1", rank: "#1" },
    { id: 2, name: "saidul islam", subtitle: "Chattogram University", avatar: "https://i.pravatar.cc/150?u=2", rank: "#2" },
    { id: 3, name: "Monoar Hossen", subtitle: "", avatar: "https://i.pravatar.cc/150?u=3", rank: "#3", placeholderIcon: "🤖" },
    { id: 4, name: "Monoar Hossen", subtitle: "", avatar: "https://i.pravatar.cc/150?u=4", rank: "#4", placeholderIcon: "👾" },
    { id: 5, name: "", subtitle: "", avatar: "https://i.pravatar.cc/150?u=5", rank: "#5", placeholderIcon: "🍁" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Remove the dark background wrapper so cards sit directly on the page background */}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors -ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-neutral-800 dark:text-neutral-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {examTitle}
          </h2>
        </div>

        {status === "taken" && (
          <div className="bg-[#ebd9d9] dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z" clipRule="evenodd" />
            </svg>
            ৯
          </div>
        )}
      </div>

      <div className={`grid gap-12 lg:gap-16 ${status === "taken" ? "lg:grid-cols-[1fr_1fr]" : "max-w-2xl mx-auto"}`}>
        
        {/* Left Column: Shared details */}
        <div className="space-y-6">
          
          {/* Schedule Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center justify-center gap-2 font-extrabold text-lg text-neutral-900 dark:text-white mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-teal-700 dark:text-teal-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
              সময়সূচী
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="font-extrabold text-neutral-900 dark:text-white text-lg">
                  {currentSchedule.start.date}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  {currentSchedule.start.time}
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-neutral-900 dark:text-white text-lg">
                  {currentSchedule.end.date}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  {currentSchedule.end.time}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-neutral-900 dark:text-white font-extrabold text-lg">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ১ ঘন্টা
              </div>
              <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700"></div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                ১০০ প্রশ্ন
              </div>
            </div>
            
            <div className="bg-[#ebfaef] dark:bg-green-900/30 text-[#2ca05a] dark:text-green-400 px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
              Ongoing
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button className="w-full bg-[#0B6B42] hover:bg-[#095937] text-white py-3.5 rounded-xl font-bold text-lg transition-colors">
              {status === "untaken" ? "পরীক্ষা শুরু করো" : "পুনরায় পরীক্ষা দাও"}
            </button>
            <button className="w-full bg-transparent border-2 border-[#0B6B42] text-[#0B6B42] dark:border-green-600 dark:text-green-500 py-3.5 rounded-xl font-bold text-lg hover:bg-[#0B6B42]/5 dark:hover:bg-green-900/20 transition-colors">
              {status === "untaken" ? "অন্যান্য পরীক্ষা" : "প্রশ্ন দেখো"}
            </button>
          </div>

          {/* Previous Attempts (Taken Only) */}
          {status === "taken" && (
            <div className="mt-8">
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
                পূর্বের প্রচেষ্টাসমূহ
              </h3>
              <div className="space-y-4">
                {previousAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-lg text-neutral-900 dark:text-white">
                        {attempt.attemptText}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                        {attempt.date}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center font-extrabold text-lg text-neutral-700 dark:text-neutral-300">
                      {attempt.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Leaderboard (Taken Only) */}
        {status === "taken" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                লিডারবোর্ড
              </h3>
              <button className="w-10 h-10 bg-[#0B6B42] hover:bg-[#095937] text-white rounded-full flex items-center justify-center transition-colors shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {user.avatar ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-2xl shrink-0">
                        {user.placeholderIcon}
                      </div>
                    )}
                    
                    {/* Details */}
                    <div>
                      <div className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">
                        {user.name || "Unknown"}
                      </div>
                      {user.subtitle && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                          {user.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Rank */}
                  <div className="font-black text-neutral-800 dark:text-neutral-200 text-xl pl-4">
                    {user.rank}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LiveExamDetailsView;
