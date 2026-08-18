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
      id: "engineering",
      title: "ইঞ্জিনিয়ারিং",
      subtitle: "বুয়েট, কুয়েট, রুয়েট, চুয়েট\nসাপ্তাহিক মডেল টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-blue-600 to-indigo-900",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Engineering Weekly",
    },
    {
      id: "medical",
      title: "মেডিকেল",
      subtitle: "মেডিকেল ও ডেন্টাল ভর্তি\nপূর্ণাঙ্গ মডেল টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-rose-600 to-red-900",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Medical Weekly",
    },
    {
      id: "varsity",
      title: "ভার্সিটি ক-ইউনিট",
      subtitle: "ঢাকা বিশ্ববিদ্যালয় ও সমন্বিত গুচ্ছ\nভর্তি পরীক্ষা প্রস্তুতি",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-purple-600 to-indigo-950",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "Varsity Weekly",
    },
    {
      id: "hsc",
      title: "এইচএসসি স্পেশাল",
      subtitle: "বিজ্ঞান বিভাগ\nঅধ্যায়ভিত্তিক বোর্ড টেস্ট",
      footerIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      footerText: "উইকলি",
      gradient: "bg-gradient-to-br from-emerald-600 to-teal-900",
      bgImage: "https://cdn-icons-png.flaticon.com/512/2941/2941490.png",
      categoryTitle: "HSC Weekly",
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
