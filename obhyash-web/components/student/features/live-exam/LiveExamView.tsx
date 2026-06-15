import React, { useState } from "react";
import LiveExamCategoryView from "./LiveExamCategoryView";
import AppLayout from "@/components/student/ui/layout/AppLayout";

export interface LiveExamViewProps {
  commonLayoutProps: any;
}

const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; title: string } | null>(null);

  const cards = [
    {
      id: "admission",
      title: "এডমিশন",
      subtitle: "মডেল টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      footerText: "২০২৫",
      gradient: "bg-gradient-to-br from-red-500 to-red-800",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png", // graduation cap placeholder
      categoryTitle: "Admission - 2025",
    },
    {
      id: "medical",
      title: "মেডিকেল",
      subtitle: "অ্যাডমিশন টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-800",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Medical weekly - 2025",
    },
    {
      id: "engineering",
      title: "ইঞ্জিনিয়ারিং",
      subtitle: "অ্যাডমিশন টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-900",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Engineering weekly - 2025",
    },
    {
      id: "varsity_a",
      title: "ভার্সিটি",
      subtitle: "ক ইউনিট\nঅ্যাডমিশন টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-teal-600 to-emerald-900",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Varsity A weekly - 2025",
    },

  ];

  if (selectedCategory) {
    return (
      <LiveExamCategoryView
        categoryTitle={selectedCategory.title}
        commonLayoutProps={commonLayoutProps}
        onBack={() => setSelectedCategory(null)}
        onExamClick={(examId, status) => {
          // This will be handled in the next step when the user provides images
          console.log(`Clicked exam ${examId} with status ${status}`);
        }}
      />
    );
  }

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title="লাইভ পরীক্ষা"
    >
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 pt-4 md:pt-6 animate-in fade-in duration-300 min-h-[80vh]">
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2F61E1] dark:text-blue-400">
            মডেল টেস্ট
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCategory({ id: card.id, title: card.categoryTitle })}
              className={`relative overflow-hidden rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 aspect-square flex flex-col justify-between ${card.gradient}`}
            >
              
              {/* Glassy Overlay Highlight (Top Half) */}
              <div className="absolute top-0 left-0 w-full h-[45%] bg-white/20 backdrop-blur-[2px] rounded-b-[40px] pointer-events-none border-b border-white/30 z-10"></div>
              
              {/* Faint Background Image */}
              {card.bgImage && (
                <div 
                  className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] opacity-10 bg-no-repeat bg-contain bg-bottom pointer-events-none"
                  style={{ backgroundImage: `url(${card.bgImage})` }}
                ></div>
              )}

              {/* Live Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-red-500/50">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Live
                </div>
              </div>

              {/* Content Box */}
              <div className="relative z-20 p-6 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-black text-white text-3xl md:text-4xl tracking-tight">
                    {card.title}
                  </h3>
                  
                  {card.subtitle && (
                    <div className="mt-2 text-white/90 font-bold text-sm md:text-base leading-tight whitespace-pre-line">
                      {card.subtitle}
                    </div>
                  )}
                </div>

                {/* Footer Section */}
                {card.footerText && (
                  <div className="flex items-center justify-end text-white font-bold text-xl md:text-2xl gap-2 mt-auto self-end">
                    {card.footerIcon}
                    <span>{card.footerText}</span>
                  </div>
                )}
              </div>

            </div>
          ))}
      </div>
    </div>
    </AppLayout>
  );
};

export default LiveExamView;
