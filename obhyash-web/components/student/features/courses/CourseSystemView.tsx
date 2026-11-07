"use client";

import { useEffect, useState, type ReactNode } from "react"

type IconName = "arrow-left" | "book" | "calendar" | "check-circle" | "file" | "clock" | "history" | "leaderboard" | "message" | "practice" | "shuffle" | "test" | "write"

function Icon({
  name,
  className = "size-6",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-left": <path d="m15 18-6-6 6-6" />,
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
      </>
    ),
    calendar: (
      <>
        <rect width="18" height="17" x="3" y="4" rx="3" />
        <path d="M8 2v4M16 2v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
      </>
    ),
    "check-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    leaderboard: (
      <>
        <path d="M8 21v-8H4v8M14 21V5h-4v16M20 21V9h-4v12M3 21h18" />
        <path d="m17 3 .8 1.5 1.7.3-1.2 1.3.2 1.7-1.5-.7-1.5.7.2-1.7-1.2-1.3 1.7-.3z" />
      </>
    ),
    message: (
      <>
        <path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
        <path d="M8 8h8M8 12h5" />
      </>
    ),
    practice: (
      <>
        <path d="m4 16 10-10 4 4L8 20l-5 1zM12 8l4 4" />
        <path d="M16 4h4v4" />
      </>
    ),
    shuffle: (
      <>
        <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </>
    ),
    test: (
      <>
        <rect width="16" height="18" x="4" y="3" rx="2" />
        <path d="M8 8h8M8 12h5M8 16h3" />
      </>
    ),
    write: (
      <>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
        <path d="m14 6 3 3" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  )
}

const menuItems: { label: string; icon: IconName; tone: string }[] = [
  { label: "পরীক্ষা দিন", icon: "write", tone: "bg-[#176B5B]" },
  { label: "Leaderboard", icon: "leaderboard", tone: "bg-[#C98A1A]" },
  { label: "Practice", icon: "practice", tone: "bg-[#7B3F61]" },
  { label: "পরীক্ষার ইতিহাস", icon: "history", tone: "bg-[#2D6F8E]" },
  { label: "Mentor Support", icon: "message", tone: "bg-[#D85B4A]" },
  { label: "Model Tests", icon: "test", tone: "bg-[#4F7A35]" },
  { label: "Rapid Test", icon: "shuffle", tone: "bg-[#176B5B]" },
  { label: "Materials", icon: "book", tone: "bg-[#4F7A35]" },
]

function BatchHome({ onOpenCourses }: { onOpenCourses: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 py-8">
      <div className="mb-7">
        <p className="text-sm font-semibold tracking-wide text-[#176B5B]">
          আমার কোর্স
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          পরীক্ষার ব্যাচ
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          প্রস্তুতি চালিয়ে যেতে একটি ব্যাচ বেছে নিন।
        </p>
      </div>

      <button
        className="group flex items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_14px_35px_-25px_rgba(23,107,91,0.65)] ring-1 ring-[#E7F1EE] transition hover:-translate-y-0.5 hover:ring-[#B9D6CF] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#176B5B]"
        onClick={onOpenCourses}
        type="button"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#2D6F8E] text-white shadow-md">
          <Icon name="book" />
        </span>
        <span className="flex-1">
          <span className="block text-base font-bold text-slate-900">
            কোর্স সমূহ
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            সব কোর্স দেখুন
          </span>
        </span>
        <Icon
          className="size-4 rotate-180 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#176B5B]"
          name="arrow-left"
        />
      </button>
    </main>
  )
}

function ExamDashboard({
  courseId,
  courseTitle,
  onBack,
  onOpenLeaderboard,
  onOpenModelTests,
  onOpenPractice,
  onOpenMaterials,
  onOpenAttendExam,
  onOpenHistory,
}: {
  courseId: string
  courseTitle: string
  onBack: () => void
  onOpenLeaderboard: () => void
  onOpenModelTests: () => void
  onOpenPractice: () => void
  onOpenMaterials: () => void
  onOpenAttendExam: () => void
  onOpenHistory: () => void
}) {
  const content = getContent(courseId)
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-10">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">
          {courseTitle}
        </h1>
      </header>

      <section className="px-5" aria-labelledby="upcoming-title">
        {/* Paused / Starting Date Notice Banner */}
        <div className="mb-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <div className="p-1 rounded-lg bg-amber-200/60 shrink-0 text-amber-800 mt-0.5">
            <Icon className="size-4" name="clock" />
          </div>
          <div className="flex-1">
            <strong className="block text-[12.5px] font-bold text-amber-950">
              মডেল টেস্ট শুরু আগামী ১০ নভেম্বর
            </strong>
            <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
              মডেল টেস্ট পরীক্ষা সাময়িকভাবে স্থগিত রয়েছে। আগামী ১০ নভেম্বর (মঙ্গলবার) সন্ধ্যা ৬:০০ টা থেকে রুটিন অনুযায়ী MT-01 পরীক্ষা শুরু হবে।
            </p>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2
            className="text-base font-bold text-slate-900"
            id="upcoming-title"
          >
            আসন্ন পরীক্ষা
          </h2>
          <span className="text-xs font-medium text-slate-400">এই সপ্তাহ</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              day: "১০ নভেম্বর",
              code: "MT-01",
              topics: content.upcoming[0],
              tone: "today",
              date: "১০ নভেম্বর",
            },
            {
              day: "১১ নভেম্বর",
              code: "MT-02",
              topics: content.upcoming[1],
              tone: "tomorrow",
              date: "১১ নভেম্বর",
            },
          ].map((exam) => (
            <button
              className={`group flex flex-col rounded-2xl border bg-white p-3.5 text-left shadow-[0_10px_24px_-20px_rgba(23,35,33,0.55)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B] ${
                exam.tone === "today" ? "border-[#CFE3DD]" : "border-[#EDD9CE]"
              }`}
              key={exam.day}
              onClick={() =>
                (window.location.hash = `model-test-${exam.code.slice(3)}`)
              }
              type="button"
            >
              <span className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    exam.tone === "today"
                      ? "bg-[#E3F1ED] text-[#176B5B]"
                      : "bg-[#FBEAE1] text-[#B4552F]"
                  }`}
                >
                  {exam.tone === "today" && (
                    <span className="size-1.5 animate-pulse rounded-full bg-[#176B5B]" />
                  )}
                  {exam.day}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {exam.date}
                </span>
              </span>

              <span className="mt-3 block text-[22px] font-extrabold leading-none tracking-tight text-slate-900">
                {exam.code}
              </span>
              <span className="mt-2 line-clamp-2 min-h-[2.6rem] text-xs leading-[1.3rem] text-slate-500">
                {exam.topics}
              </span>

              <span className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-slate-200 pt-3 text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0 text-slate-400" name="clock" />
                  সন্ধ্যা ৬টা - রাত ১২টা
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0 text-slate-400" name="test" />
                  {formatBanglaNumber(content.duration)} মিনিট
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 px-5" aria-labelledby="explore-title">
        <h2
          className="mb-3 text-base font-bold text-slate-900"
          id="explore-title"
        >
          সব সুবিধা
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              className={`group relative flex min-h-32 flex-col items-start justify-between overflow-hidden rounded-3xl p-4 text-left text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B] ${item.tone}`}
              key={item.label}
              onClick={
                item.label === "পরীক্ষা দিন"
                  ? onOpenAttendExam
                  : item.label === "পরীক্ষার ইতিহাস"
                    ? onOpenHistory
                  : item.label === "Model Tests"
                    ? onOpenModelTests
                    : item.label === "Leaderboard"
                      ? onOpenLeaderboard
                      : item.label === "Practice"
                        ? onOpenPractice
                        : item.label === "Materials"
                          ? onOpenMaterials
                          : undefined
              }
              type="button"
            >
              <span className="absolute -right-7 -top-7 size-20 rounded-full border-[14px] border-white/15" />
              <span className="relative flex size-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
                <Icon className="size-5.5" name={item.icon} />
              </span>
              <span className="relative flex w-full items-center justify-between gap-2">
                <span className="text-sm font-bold">{item.label}</span>
                <Icon
                  className="size-4 rotate-180 text-white/75 transition group-hover:translate-x-0.5 group-hover:text-white"
                  name="arrow-left"
                />
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

const batchLeaderboards = {
  week: [
    {
      name: "Ayesha Rahman",
      college: "Holy Cross College",
      score: 96,
      rank: 1,
      change: 2,
    },
    {
      name: "Tanvir Hasan",
      college: "Notre Dame College",
      score: 93,
      rank: 2,
      change: -1,
    },
    {
      name: "Nusrat Jahan",
      college: "Viqarunnisa Noon College",
      score: 91,
      rank: 3,
      change: 1,
    },
    {
      name: "Rafiul Islam",
      college: "Dhaka College",
      score: 89,
      rank: 4,
      change: 0,
    },
    {
      name: "Sadia Akter",
      college: "Rajuk Uttara Model College",
      score: 87,
      rank: 5,
      change: 3,
    },
    {
      name: "Mehedi Hasan",
      college: "Dhaka City College",
      score: 85,
      rank: 6,
      change: -2,
    },
    {
      name: "Farzana Yasmin",
      college: "Ideal School & College",
      score: 82,
      rank: 7,
      change: 1,
    },
    { name: "You", college: "Your College", score: 78, rank: 18, change: 4 },
  ],
  all: [
    {
      name: "Tanvir Hasan",
      college: "Notre Dame College",
      score: 94,
      rank: 1,
      change: 0,
    },
    {
      name: "Ayesha Rahman",
      college: "Holy Cross College",
      score: 93,
      rank: 2,
      change: 1,
    },
    {
      name: "Sadia Akter",
      college: "Rajuk Uttara Model College",
      score: 90,
      rank: 3,
      change: 2,
    },
    {
      name: "Nusrat Jahan",
      college: "Viqarunnisa Noon College",
      score: 89,
      rank: 4,
      change: -1,
    },
    {
      name: "Rafiul Islam",
      college: "Dhaka College",
      score: 88,
      rank: 5,
      change: 0,
    },
    {
      name: "Farzana Yasmin",
      college: "Ideal School & College",
      score: 84,
      rank: 6,
      change: 1,
    },
    {
      name: "Mehedi Hasan",
      college: "Dhaka City College",
      score: 83,
      rank: 7,
      change: -1,
    },
    { name: "You", college: "Your College", score: 76, rank: 22, change: 3 },
  ],
}

type LeaderboardStudent = {
  name: string
  college?: string
  score: number
  rank: number
  change?: number
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
const rankColor = (rank: number) =>
  rank === 1
    ? "text-[#0F7C80]"
    : rank === 2
      ? "text-[#6B7280]"
      : rank === 3
        ? "text-[#9A5B34]"
        : "text-[#6B7280]"

function LeaderboardRow({
  student,
  scoreLabel = "avg",
}: {
  student: LeaderboardStudent
  scoreLabel?: string
}) {
  const isYou = student.name === "You"
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        isYou ? "bg-[#F2F5F1]" : ""
      }`}
    >
      <span
        className={`w-7 shrink-0 text-center text-sm font-bold tabular-nums ${rankColor(student.rank)}`}
      >
        {String(student.rank).padStart(2, "0")}
      </span>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${
          isYou ? "bg-[#0E5F63] text-[#DDF5F2]" : "bg-[#F0EEE8] text-[#3F4741]"
        }`}
      >
        {isYou ? "আমি" : initials(student.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#171A18]">
          {isYou ? "আপনি" : student.name}
        </span>
        {student.college && (
          <span className="mt-0.5 block truncate text-xs text-[#7B7F78]">
            {student.college}
          </span>
        )}
      </span>
      <span className="text-right">
        <strong className="block text-base font-bold tabular-nums text-[#171A18]">
          {student.score}
        </strong>
        <span className="text-[10px] font-medium text-[#8A8E87]">
          {scoreLabel}
        </span>
      </span>
    </div>
  )
}

function LeaderboardPage({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [period, setPeriod] = useState<"week" | "all">("week")
  const students = batchLeaderboards[period]
  const you = students.find((student) => student.name === "You")!
  const podium = [students[1], students[0], students[2]]
  const medal = {
    1: {
      label: "1st",
      ring: "border-[#8DD8D2]",
      block: "bg-[#BFEDEA] text-[#0B4B4F]",
      height: "h-[104px]",
    },
    2: {
      label: "2nd",
      ring: "border-[#C9CCC6]",
      block: "bg-[#D8DAD5] text-[#30352F]",
      height: "h-[88px]",
    },
    3: {
      label: "3rd",
      ring: "border-[#BC8159]",
      block: "bg-[#D7B096] text-[#3C2416]",
      height: "h-[76px]",
    },
  } as const

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F7F5F0] pb-32">
      <header className="sticky top-0 z-30 flex bg-[#0E5F63] text-white h-16 items-center justify-center px-14">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#BFEDEA]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold">Leaderboard</h1>
      </header>
      <section className="bg-[#0E5F63] text-white">
        <div className="px-5 pt-1">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#A8E1DD]">
                {getContent(courseId).short} RANKING
              </p>
              <h2 className="mt-1 text-2xl font-bold leading-tight text-[#FFF9EC]">
                শীর্ষ শিক্ষার্থী
              </h2>
            </div>
            <div
              className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.06] p-1"
              role="tablist"
              aria-label="Leaderboard period"
            >
              {[
                ["week", "সপ্তাহ"],
                ["all", "সব সময়"],
              ].map(([id, label]) => (
                <button
                  aria-selected={period === id}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    period === id
                      ? "bg-[#DDF5F2] text-[#0E5F63]"
                      : "text-[#C9E8E6] hover:text-white"
                  }`}
                  key={id}
                  onClick={() => setPeriod(id as "week" | "all")}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 items-end gap-2">
            {podium.map((student) => {
              const style = medal[(student.rank as 1 | 2 | 3)]
              const first = student.rank === 1
              return (
                <div
                  className="min-w-0 text-center"
                  key={`${period}-${student.name}`}
                >
                  <span
                    className={`mx-auto grid place-items-center rounded-full border-2 bg-[#167176] font-bold text-[#FFF9EC] ${style.ring} ${
                      first ? "size-16 text-lg" : "size-13 text-sm"
                    }`}
                  >
                    {initials(student.name)}
                  </span>
                  <p className="mt-2 truncate text-xs font-semibold text-[#FFF9EC]">
                    {student.name}
                  </p>
                  <p className="line-clamp-2 min-h-7 text-[10px] leading-3.5 text-[#B7DCD9]">
                    {student.college}
                  </p>
                  <div
                    className={`mt-3 flex flex-col items-center justify-center rounded-t-2xl px-2 ${style.block} ${style.height}`}
                  >
                    <span className="block text-[11px] font-bold opacity-70">
                      {style.label}
                    </span>
                    <strong className="mt-1.5 block text-2xl leading-none tabular-nums">
                      {student.score}
                    </strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F5F0] px-5 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#171A18]">সম্পূর্ণ র‍্যাঙ্কিং</h2>
          <span className="text-xs font-medium text-[#7B7F78]">গড় নম্বর</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <div className="divide-y divide-[#EFEDE7]">
            {students
              .slice(3)
              .filter((student) => student.name !== "You")
              .map((student) => (
                <LeaderboardRow
                  key={`${period}-${student.name}`}
                  student={student}
                />
              ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-4 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#0E5F63] px-4 py-3 text-white shadow-[0_10px_28px_rgba(14,95,99,0.24)]">
          <span className="text-sm font-bold tabular-nums text-[#BFEDEA]">
            #{you.rank}
          </span>
          <span className="grid size-10 place-items-center rounded-full bg-[#DDF5F2] text-xs font-bold text-[#0E5F63]">
            আমি
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">আপনার অবস্থান</span>
            <span className="block truncate text-xs text-[#BFE1DE]">
              {you.college}
            </span>
          </span>
          <span className="text-right">
            <strong className="block text-lg leading-none tabular-nums">
              {you.score}
            </strong>
            <span className="text-[10px] text-[#BFE1DE]">avg</span>
          </span>
        </div>
      </div>
    </main>
  )
}

const subjectTopics: Record<string, string[]> = {
  "বাংলাদেশ": ["প্রাচীন বাংলা", "মুক্তিযুদ্ধ", "সংবিধান", "ভূগোল ও অর্থনীতি", "সাম্প্রতিক বাংলাদেশ"],
  "আন্তর্জাতিক": ["আন্তর্জাতিক সংস্থা", "বিশ্ব রাজনীতি", "চুক্তি ও সম্মেলন", "সাম্প্রতিক বিশ্ব"],
  "ইংরেজি": ["Parts of Speech", "Tense", "Voice", "Narration", "Vocabulary"],
  "বাংলা": ["সন্ধি", "সমাস", "কারক ও বিভক্তি", "বানান ও শব্দ", "সাহিত্য"],
  "গণিত": ["বীজগণিত", "জ্যামিতি", "ত্রিকোণমিতি", "ক্যালকুলাস", "ম্যাট্রিক্স"],
  "পদার্থবিজ্ঞান": ["ভৌত জগৎ ও পরিমাপ", "ভেক্টর", "গতিবিদ্যা", "নিউটনিয়ান বলবিদ্যা", "কাজ, শক্তি ও ক্ষমতা"],
  "রসায়ন": ["পরমাণুর গঠন", "পর্যায় সারণি", "রাসায়নিক বন্ধন", "জৈব রসায়ন", "পরিমাণগত রসায়ন"],
  "জীববিজ্ঞান": ["কোষ ও কোষ বিভাজন", "উদ্ভিদ শারীরতত্ত্ব", "প্রাণীর পরিচিতি", "মানব শারীরতত্ত্ব", "জিনতত্ত্ব"],
  "সাধারণ জ্ঞান": ["বাংলাদেশ বিষয়াবলি", "আন্তর্জাতিক বিষয়াবলি", "সাম্প্রতিক ঘটনা"],
  "আইসিটি": ["তথ্য প্রযুক্তি", "নেটওয়ার্কিং", "সংখ্যা পদ্ধতি", "প্রোগ্রামিং"],
}

function PracticePage({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const practiceSubjects = getContent(courseId).subjects.map((item) => item.name)
  const [selectedSubjects, setSelectedSubjects] = useState(practiceSubjects)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [topicsOpen, setTopicsOpen] = useState(false)
  const topicKey = (subject: string, topic: string) => `${subject}::${topic}`
  const availableTopics = selectedSubjects.flatMap((subject) =>
    (subjectTopics[subject] ?? []).map((topic) => topicKey(subject, topic)),
  )
  const toggleTopic = (key: string) => {
    setCreated(false)
    setSelectedTopics((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }
  const [questions, setQuestions] = useState("50")
  const [customQuestions, setCustomQuestions] = useState("")
  const [duration, setDuration] = useState("30")
  const [customDuration, setCustomDuration] = useState("")
  const [mode, setMode] = useState("Exam Mode")
  const [negativeMarking, setNegativeMarking] = useState(true)
  const [created, setCreated] = useState(false)

  const questionCount = questions === "custom" ? customQuestions : questions
  const hasValidQuestions =
    Number(questionCount) >= 1 && Number(questionCount) <= 200
  const durationMinutes = duration === "custom" ? customDuration : duration
  const hasValidDuration =
    Number(durationMinutes) >= 1 && Number(durationMinutes) <= 300

  const toggleSubject = (subject: string) => {
    setCreated(false)
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    )
    setSelectedTopics((current) => current.filter((key) => !key.startsWith(`${subject}::`)))
  }

  const canCreate =
    selectedSubjects.length > 0 && hasValidQuestions && hasValidDuration
  const update = (callback: () => void) => {
    callback()
    setCreated(false)
  }
  const optionClass = (active: boolean) =>
    `h-9 rounded-lg border text-xs font-semibold transition ${
      active
        ? "border-[#0B4F55] bg-[#0B4F55] text-white"
        : "border-[#DDE6E4] bg-white text-[#405250] hover:border-[#8CCBC6]"
    }`

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F7F4F1] pb-24">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0B4F55]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">
          Create Mock Exam
        </h1>
      </header>

      <form
        id="mock-exam-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (canCreate) setCreated(true)
        }}
      >
        <section className="mx-5 mt-1 rounded-2xl bg-[#0B4F55] px-4 py-3 text-white">
          <div className="flex items-end gap-1.5">
            <strong className="text-2xl font-bold leading-none tabular-nums">
              {questionCount || "—"}
            </strong>
            <span className="pb-0.5 text-xs font-semibold text-[#DDF5F2]">
              প্রশ্ন
            </span>
            <span className="mx-1 pb-0.5 text-[#8CCBC6]">/</span>
            <strong className="text-2xl font-bold leading-none tabular-nums">
              {durationMinutes || "—"}
            </strong>
            <span className="pb-0.5 text-xs font-semibold text-[#DDF5F2]">
              মিনিট
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(selectedSubjects.length
              ? selectedSubjects
              : ["কোনো বিষয় নেই"]
            ).map((subject) => (
              <span
                className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold text-[#E7F8F6]"
                key={subject}
              >
                {subject}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-[#BDE7E3]">
            <span>
              {mode === "Exam Mode" ? "Timer সহ পরীক্ষা" : "সাথে সাথে উত্তর"}
            </span>
            <span>
              {selectedTopics.length ? `${formatBanglaNumber(selectedTopics.length)}টি টপিক · ` : ""}
              {negativeMarking ? "Negative: 0.25" : "No negative"}
            </span>
          </div>
        </section>

        <div className="mt-3 space-y-2 px-5">
          <fieldset className="rounded-xl border border-[#E8E1DC] bg-white p-3">
            <legend className="sr-only">Subjects</legend>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#211E1C]">বিষয়</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {practiceSubjects.map((subject) => {
                const active = selectedSubjects.includes(subject)
                return (
                  <button
                    aria-pressed={active}
                    className={`${optionClass(active)} px-2`}
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    type="button"
                  >
                    {subject}
                  </button>
                )
              })}
            </div>
            {!selectedSubjects.length && (
              <p className="mt-2 text-xs font-semibold text-[#A1453A]">
                কমপক্ষে একটি বিষয় বেছে নিন।
              </p>
            )}
          </fieldset>

          <fieldset className="relative rounded-xl border border-[#E8E1DC] bg-white p-3">
            <legend className="sr-only">Topics</legend>
            <span className="mb-2 block text-xs font-bold text-[#211E1C]">টপিক</span>
            <button
              aria-expanded={topicsOpen}
              aria-haspopup="listbox"
              className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#DDE6E4] bg-[#FCFAF8] px-3 text-left text-xs font-semibold text-[#172321] transition hover:border-[#8CCBC6] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedSubjects.length}
              onClick={() => setTopicsOpen((open) => !open)}
              type="button"
            >
              <span className="truncate">
                {selectedTopics.length === 0
                  ? "সব টপিক"
                  : selectedTopics.length === 1
                    ? selectedTopics[0].split("::")[1]
                    : `${formatBanglaNumber(selectedTopics.length)}টি টপিক নির্বাচিত`}
              </span>
              <Icon className={`size-4 shrink-0 text-[#5E6F6C] transition ${topicsOpen ? "rotate-90" : "-rotate-90"}`} name="arrow-left" />
            </button>

            {topicsOpen && (
              <>
                <button aria-label="টপিক বন্ধ করুন" className="fixed inset-0 z-40 cursor-default" onClick={() => setTopicsOpen(false)} type="button" />
                <div className="absolute inset-x-3 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-[0_18px_40px_-16px_rgba(15,35,33,0.35)]" role="listbox" aria-multiselectable="true">
                  <div className="flex items-center justify-between border-b border-[#EEF1EF] px-3 py-2">
                    <span className="text-[11px] font-semibold text-[#5E6F6C]">
                      {selectedTopics.length ? `${formatBanglaNumber(selectedTopics.length)}টি নির্বাচিত` : "কিছু না বাছলে সব টপিক থাকবে"}
                    </span>
                    <span className="flex gap-1">
                      <button className="rounded-md px-2 py-1 text-[11px] font-bold text-[#0B4F55] hover:bg-[#EEF4F3]" onClick={() => update(() => setSelectedTopics(availableTopics))} type="button">সব</button>
                      <button className="rounded-md px-2 py-1 text-[11px] font-bold text-[#A1453A] hover:bg-[#FBEFEC]" onClick={() => update(() => setSelectedTopics([]))} type="button">মুছুন</button>
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {selectedSubjects.map((subject) => (
                      <div key={subject}>
                        <p className="sticky top-0 bg-white px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[#8A9693]">{subject}</p>
                        {(subjectTopics[subject] ?? []).map((topic) => {
                          const key = topicKey(subject, topic)
                          const active = selectedTopics.includes(key)
                          return (
                            <button aria-selected={active} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[#2B3634] hover:bg-[#F5F8F7]" key={key} onClick={() => toggleTopic(key)} role="option" type="button">
                              <span className={`grid size-4 shrink-0 place-items-center rounded border text-[10px] font-black ${active ? "border-[#0B4F55] bg-[#0B4F55] text-white" : "border-[#C8D2D0] bg-white text-transparent"}`}>✓</span>
                              {topic}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#EEF1EF] p-2">
                    <button className="h-9 w-full rounded-lg bg-[#0B4F55] text-xs font-bold text-white hover:bg-[#083E43]" onClick={() => setTopicsOpen(false)} type="button">সম্পন্ন</button>
                  </div>
                </div>
              </>
            )}

            {selectedTopics.length > 0 && !topicsOpen && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedTopics.map((key) => (
                  <button className="inline-flex items-center gap-1 rounded-full bg-[#EEF4F3] px-2 py-0.5 text-[10px] font-semibold text-[#0B4F55]" key={key} onClick={() => toggleTopic(key)} type="button">
                    {key.split("::")[1]}
                    <span aria-hidden="true" className="text-[#5E6F6C]">×</span>
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="rounded-xl border border-[#E8E1DC] bg-white p-3">
            <legend className="sr-only">Questions</legend>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#211E1C]">
                প্রশ্ন সংখ্যা
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["25", "50", "75", "100", "custom"].map((value) => (
                <button
                  className={optionClass(questions === value)}
                  key={value}
                  onClick={() => update(() => setQuestions(value))}
                  type="button"
                >
                  {value === "custom" ? "Custom" : value}
                </button>
              ))}
            </div>
            {questions === "custom" && (
              <input
                aria-label="Custom question number"
                autoFocus
                className="mt-2 h-9 w-full rounded-lg border border-[#BFE1DD] bg-[#FCFAF8] px-3 text-xs font-semibold text-[#172321] outline-none placeholder:text-[#A39791] focus:border-[#0B4F55] focus:ring-3 focus:ring-[#D8EFEC]"
                inputMode="numeric"
                max="200"
                min="1"
                onChange={(event) =>
                  update(() => setCustomQuestions(event.target.value))
                }
                placeholder="প্রশ্ন সংখ্যা লিখুন"
                type="number"
                value={customQuestions}
              />
            )}
            {questions === "custom" &&
              customQuestions &&
              !hasValidQuestions && (
                <p className="mt-2 text-xs font-semibold text-[#A1453A]">
                  1 থেকে 200-এর মধ্যে লিখুন।
                </p>
              )}
          </fieldset>

          <fieldset className="rounded-xl border border-[#E8E1DC] bg-white p-3">
            <legend className="sr-only">Duration</legend>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#211E1C]">সময়</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["15", "30", "45", "60", "custom"].map((value) => (
                <button
                  className={optionClass(duration === value)}
                  key={value}
                  onClick={() => update(() => setDuration(value))}
                  type="button"
                >
                  {value === "custom" ? "Custom" : value}
                </button>
              ))}
            </div>
            {duration === "custom" && (
              <input
                aria-label="Custom duration in minutes"
                autoFocus
                className="mt-2 h-9 w-full rounded-lg border border-[#BFE1DD] bg-[#FCFAF8] px-3 text-xs font-semibold text-[#172321] outline-none placeholder:text-[#A39791] focus:border-[#0B4F55] focus:ring-3 focus:ring-[#D8EFEC]"
                inputMode="numeric"
                max="300"
                min="1"
                onChange={(event) =>
                  update(() => setCustomDuration(event.target.value))
                }
                placeholder="মিনিট লিখুন"
                type="number"
                value={customDuration}
              />
            )}
            {duration === "custom" && customDuration && !hasValidDuration && (
              <p className="mt-2 text-xs font-semibold text-[#A1453A]">
                1 থেকে 300 মিনিটের মধ্যে লিখুন।
              </p>
            )}
          </fieldset>

          <fieldset className="rounded-xl border border-[#E8E1DC] bg-white p-3">
            <legend className="sr-only">পরীক্ষার ধরন</legend>
            <span className="mb-2 block text-xs font-bold text-[#211E1C]">
              পরীক্ষার ধরন
            </span>
            <div className="grid grid-cols-2 rounded-lg bg-[#EEF4F3] p-1">
              {["Exam Mode", "Practice Mode"].map((item) => (
                <button
                  className={`rounded-md px-2.5 py-1.5 text-left transition ${
                    mode === item
                      ? "bg-white text-[#0B4F55] shadow-[0_1px_3px_rgba(15,23,42,0.12)]"
                      : "text-[#5E6F6C]"
                  }`}
                  key={item}
                  onClick={() => update(() => setMode(item))}
                  type="button"
                >
                  <span className="block text-xs font-bold">{item}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded-xl border border-[#E8E1DC] bg-white px-3 py-2.5">
            <span>
              <span className="block text-xs font-bold text-[#211E1C]">
                Negative Marking
              </span>
            </span>
            <button
              aria-checked={negativeMarking}
              aria-label="Negative marking"
              className={`relative h-6 w-10 rounded-full transition ${
                negativeMarking ? "bg-[#0B4F55]" : "bg-[#C8D2D0]"
              }`}
              onClick={() =>
                update(() => setNegativeMarking((value) => !value))
              }
              role="switch"
              type="button"
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${
                  negativeMarking ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-[#F7F4F1] px-5 pb-4 pt-2">
        {created ? (
          <p
            className="mb-2 rounded-lg bg-[#DDF2EF] px-3 py-1.5 text-center text-[11px] font-semibold text-[#0B4F55]"
            role="status"
          >
            {questionCount} প্রশ্ন · {durationMinutes} মিনিটের mock exam তৈরি
            হয়েছে।
          </p>
        ) : null}
        <button
          className="h-11 w-full rounded-full bg-[#0B4F55] text-sm font-bold text-white transition hover:bg-[#083E43] disabled:cursor-not-allowed disabled:bg-[#A9C7C4]"
          disabled={!canCreate}
          form="mock-exam-form"
          type="submit"
        >
          Create Mock Exam
        </button>
      </div>
    </main>
  )
}

function MaterialsPage({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"solve" | "practice">("solve")
  const content = getContent(courseId)
  const [first, second] = content.subjects
  const materialSheets = {
    solve: [
      { title: "MT-01 Solve Sheet", meta: `${first.name}, ${second.name} · 12 pages` },
      { title: "MT-02 Solve Sheet", meta: `${content.subjects.slice(-2).map((item) => item.name).join(", ")} · 10 pages` },
      { title: "Weekly Review Solve", meta: "সব বিষয় · 16 pages" },
    ],
    practice: content.practiceSheets,
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-10">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">Materials</h1>
      </header>

      <section className="px-5">
        <div
          className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1"
          role="tablist"
          aria-label="Materials"
        >
          {[
            ["solve", "Solve Sheets"],
            ["practice", "Practice Sheets"],
          ].map(([id, label]) => (
            <button
              aria-selected={activeTab === id}
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                activeTab === id
                  ? "bg-white text-[#0F4F43] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              key={id}
              onClick={() => setActiveTab(id as "solve" | "practice")}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3" role="tabpanel">
          {materialSheets[activeTab].map((sheet) => (
            <button
              className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-[#E7F1EE]"
              key={sheet.title}
              type="button"
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                  activeTab === "solve"
                    ? "bg-[#E7F1EE] text-[#176B5B]"
                    : "bg-[#F4E9EF] text-[#7B3F61]"
                }`}
              >
                <Icon
                  className="size-5"
                  name={activeTab === "solve" ? "book" : "practice"}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">
                  {sheet.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {sheet.meta}
                </span>
              </span>
              <Icon
                className="size-4 rotate-180 text-slate-300"
                name="arrow-left"
              />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

const courses = [
  {
    id: "engineering-free",
    price: 0,
    type: "free",
    title: "ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি",
    detail: "পদার্থ, রসায়ন, গণিত ও ইংরেজি",
    lessons: "20 Model Tests",
    tone: "bg-[#2D6F8E]",
    students: 3120,
  },
  {
    id: "varsity-free",
    price: 0,
    type: "free",
    title: "ভার্সিটি ভর্তি প্রস্তুতি",
    detail: "বাংলা, ইংরেজি, সাধারণ জ্ঞান ও আইসিটি",
    lessons: "20 Model Tests",
    tone: "bg-[#C98A1A]",
    students: 4580,
  },
  {
    id: "medical-pcb",
    price: 0,
    type: "free",
    title: "মেডিকেল PCB প্রস্তুতি",
    detail: "পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞান",
    lessons: "20 Model Tests",
    tone: "bg-[#4F7A35]",
    students: 3890,
  },
  {
    id: "gke-batch",
    price: 1999,
    type: "premium",
    title: "জিকেই পরীক্ষা ব্যাচ",
    detail: "বাংলাদেশ, আন্তর্জাতিক ও ইংরেজি",
    lessons: "70 Model Tests",
    tone: "bg-[#176B5B]",
    students: 4119,
  },
  {
    id: "ssc-final",
    price: 799,
    type: "premium",
    title: "এসএসসি ফাইনাল মডেল টেস্ট",
    detail: "বোর্ড প্রশ্নের ধরনে বিষয়ভিত্তিক মডেল টেস্ট",
    lessons: "40 Model Tests",
    tone: "bg-[#7B3F61]",
    students: 6240,
  },
  {
    id: "krishi-guccho",
    price: 1499,
    type: "premium",
    title: "কৃষি গুচ্ছ ভর্তি প্রস্তুতি",
    detail: "পদার্থ, রসায়ন, জীববিজ্ঞান, গণিত ও ইংরেজি",
    lessons: "50 Model Tests",
    tone: "bg-[#D85B4A]",
    students: 2760,
  },
] as const

type CourseContent = {
  short: string
  category: string
  modelTests: number
  duration: number
  subjects: { name: string; questions: number }[]
  upcoming: [string, string]
  features: string[]
  practiceSheets: { title: string; meta: string }[]
}

const courseContent: Record<string, CourseContent> = {
  "engineering-free": {
    short: "ENG",
    category: "ইঞ্জিনিয়ারিং ভর্তি",
    modelTests: 20,
    duration: 60,
    subjects: [
      { name: "পদার্থবিজ্ঞান", questions: 30 },
      { name: "রসায়ন", questions: 30 },
      { name: "গণিত", questions: 30 },
      { name: "ইংরেজি", questions: 10 },
    ],
    upcoming: [
      "ভেক্টর, গতিবিদ্যা, পরমাণুর গঠন, ম্যাট্রিক্স ও নির্ণায়ক",
      "নিউটনিয়ান বলবিদ্যা, গুণগত রসায়ন, সরলরেখা, Tense",
    ],
    features: ["অধ্যায়ভিত্তিক মডেল টেস্ট", "বুয়েট ও গুচ্ছের প্রশ্ন বিশ্লেষণ", "গাণিতিক সমস্যার ব্যাখ্যা", "সলভ শিট ও প্র্যাকটিস শিট"],
    practiceSheets: [
      { title: "পদার্থবিজ্ঞান গাণিতিক সমস্যা", meta: "60 questions · 10 pages" },
      { title: "রসায়ন সূত্র ও বিক্রিয়া", meta: "50 questions · 8 pages" },
      { title: "উচ্চতর গণিত অনুশীলন", meta: "60 questions · 12 pages" },
    ],
  },
  "varsity-free": {
    short: "VAR",
    category: "ভার্সিটি ভর্তি",
    modelTests: 20,
    duration: 60,
    subjects: [
      { name: "বাংলা", questions: 30 },
      { name: "ইংরেজি", questions: 30 },
      { name: "সাধারণ জ্ঞান", questions: 25 },
      { name: "আইসিটি", questions: 15 },
    ],
    upcoming: [
      "সন্ধি, সমাস, Parts of Speech, বাংলাদেশের মুক্তিযুদ্ধ",
      "কারক ও বিভক্তি, Voice, আন্তর্জাতিক সংস্থা, নেটওয়ার্কিং",
    ],
    features: ["ইউনিটভিত্তিক মডেল টেস্ট", "বিগত বছরের প্রশ্ন সমাধান", "সাম্প্রতিক সাধারণ জ্ঞান", "সলভ শিট ও প্র্যাকটিস শিট"],
    practiceSheets: [
      { title: "বাংলা ব্যাকরণ অনুশীলন", meta: "60 questions · 9 pages" },
      { title: "English Vocabulary Practice", meta: "50 questions · 8 pages" },
      { title: "সাম্প্রতিক সাধারণ জ্ঞান", meta: "40 questions · 6 pages" },
    ],
  },
  "medical-pcb": {
    short: "PCB",
    category: "মেডিকেল ভর্তি",
    modelTests: 20,
    duration: 60,
    subjects: [
      { name: "পদার্থবিজ্ঞান", questions: 30 },
      { name: "রসায়ন", questions: 30 },
      { name: "জীববিজ্ঞান", questions: 40 },
    ],
    upcoming: [
      "কোষ ও এর গঠন, ভৌত জগৎ ও পরিমাপ, রসায়নের ধারণা",
      "কোষ বিভাজন, ভেক্টর, পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন",
    ],
    features: ["PCB অধ্যায়ভিত্তিক পরীক্ষা", "মেডিকেল প্রশ্নব্যাংক বিশ্লেষণ", "জীববিজ্ঞানের চিত্রভিত্তিক প্রশ্ন", "সলভ শিট ও প্র্যাকটিস শিট"],
    practiceSheets: [
      { title: "জীববিজ্ঞান প্রথম পত্র", meta: "60 questions · 10 pages" },
      { title: "রসায়ন প্রশ্নব্যাংক", meta: "50 questions · 8 pages" },
      { title: "পদার্থবিজ্ঞান সূত্র অনুশীলন", meta: "40 questions · 7 pages" },
    ],
  },
  "gke-batch": {
    short: "GKE",
    category: "জিকেই পরীক্ষা",
    modelTests: 70,
    duration: 60,
    subjects: [
      { name: "বাংলাদেশ", questions: 40 },
      { name: "আন্তর্জাতিক", questions: 30 },
      { name: "ইংরেজি", questions: 30 },
    ],
    upcoming: [
      "প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, বিশেষ্য, নির্ধারক, আর্টিকেল, বচন, লিঙ্গ",
      "ব্রিটিশ শাসন, ভাষা আন্দোলন, সর্বনাম ও এর শ্রেণিবিভাগ, সর্বনামের ব্যবহার",
    ],
    features: ["লাইভ ডেইলি ও উইকলি এক্সাম", "বিষয়ভিত্তিক মডেল টেস্ট", "সলভ শিট ও প্র্যাকটিস শিট", "মেন্টর সাপোর্ট"],
    practiceSheets: [
      { title: "বাংলাদেশ বিষয়াবলি", meta: "50 questions · 8 pages" },
      { title: "আন্তর্জাতিক বিষয়াবলি", meta: "40 questions · 7 pages" },
      { title: "English Grammar Practice", meta: "60 questions · 9 pages" },
    ],
  },
  "ssc-final": {
    short: "SSC",
    category: "এসএসসি ফাইনাল",
    modelTests: 40,
    duration: 30,
    subjects: [
      { name: "বাংলা", questions: 30 },
      { name: "ইংরেজি", questions: 30 },
      { name: "গণিত", questions: 30 },
      { name: "পদার্থবিজ্ঞান", questions: 25 },
      { name: "রসায়ন", questions: 25 },
      { name: "জীববিজ্ঞান", questions: 25 },
    ],
    upcoming: [
      "বাংলা ১ম পত্র: গদ্য ও পদ্য, গণিত: বীজগাণিতিক রাশি",
      "পদার্থবিজ্ঞান: গতি ও বল, রসায়ন: পর্যায় সারণি",
    ],
    features: ["বোর্ড প্রশ্নের মানে MCQ মডেল টেস্ট", "বিষয়ভিত্তিক ফলাফল বিশ্লেষণ", "বিগত বোর্ড প্রশ্ন সমাধান", "সলভ শিট ও প্র্যাকটিস শিট"],
    practiceSheets: [
      { title: "সাধারণ গণিত MCQ", meta: "60 questions · 10 pages" },
      { title: "বাংলা ১ম পত্র MCQ", meta: "50 questions · 8 pages" },
      { title: "বিজ্ঞান বোর্ড প্রশ্ন", meta: "75 questions · 12 pages" },
    ],
  },
  "krishi-guccho": {
    short: "AGRI",
    category: "কৃষি গুচ্ছ ভর্তি",
    modelTests: 50,
    duration: 60,
    subjects: [
      { name: "পদার্থবিজ্ঞান", questions: 20 },
      { name: "রসায়ন", questions: 20 },
      { name: "জীববিজ্ঞান", questions: 20 },
      { name: "গণিত", questions: 20 },
      { name: "ইংরেজি", questions: 20 },
    ],
    upcoming: [
      "উদ্ভিদ শারীরতত্ত্ব, ভেক্টর, পরিমাণগত রসায়ন, Preposition",
      "প্রাণীর পরিচিতি, কাজ ও শক্তি, জৈব রসায়ন, অন্তরীকরণ",
    ],
    features: ["কৃষি গুচ্ছের মানে মডেল টেস্ট", "বিগত বছরের প্রশ্ন বিশ্লেষণ", "বিষয়ভিত্তিক দুর্বলতা চিহ্নিতকরণ", "মেন্টর সাপোর্ট"],
    practiceSheets: [
      { title: "জীববিজ্ঞান প্রশ্নব্যাংক", meta: "60 questions · 10 pages" },
      { title: "রসায়ন ও পদার্থ মিশ্র", meta: "50 questions · 9 pages" },
      { title: "Agri English Practice", meta: "40 questions · 6 pages" },
    ],
  },
}

const getContent = (id: string) => courseContent[id] ?? courseContent["gke-batch"]
const subjectColors = ["bg-[#4F7A35]", "bg-[#176B5B]", "bg-[#7B3F61]", "bg-[#D85B4A]", "bg-[#C98A1A]", "bg-[#2D6F8E]"]
const totalQuestions = (content: CourseContent) =>
  content.subjects.reduce((sum, item) => sum + item.questions, 0)

type Course = typeof courses[number]
type CourseTab = "free" | "premium" | "mine"

const ENROLLMENT_STORAGE_KEY = "enrolled-course-ids"
const ACTIVE_COURSE_STORAGE_KEY = "active-course-id"
const formatBanglaNumber = (value: number) =>
  new Intl.NumberFormat("bn-BD").format(value)
const getCourse = (id: string) => courses.find((course) => course.id === id)

function CoursesPage({
  enrolledIds,
  onBack,
  onOpenCourse,
}: {
  enrolledIds: string[]
  onBack: () => void
  onOpenCourse: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<CourseTab>("free")
  const visibleCourses =
    activeTab === "mine"
      ? courses.filter((course) => enrolledIds.includes(course.id))
      : courses.filter((course) => course.type === activeTab)

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-10">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-5 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">কোর্স সমূহ</h1>
      </header>

      <section className="px-5">
        <div
          className="grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1"
          role="tablist"
          aria-label="Course categories"
        >
          {[
            ["free", "ফ্রি কোর্স"],
            ["premium", "প্রিমিয়াম"],
            ["mine", "আমার কোর্স"],
          ].map(([id, label]) => (
            <button
              aria-selected={activeTab === id}
              className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
                activeTab === id
                  ? "bg-white text-[#0F4F43] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              key={id}
              onClick={() => setActiveTab(id as CourseTab)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 space-y-3 px-5" role="tabpanel">
        {visibleCourses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <p className="text-sm font-bold text-slate-800">
              এখনো কোনো কোর্সে এনরোল করেননি
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ফ্রি বা প্রিমিয়াম কোর্স থেকে একটি বেছে নিন।
            </p>
          </div>
        )}
        {visibleCourses.map((course) => (
          <button
            className="group flex w-full items-center gap-4 rounded-3xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-[#E7F1EE]"
            key={course.title}
            onClick={() => onOpenCourse(course.id)}
            type="button"
          >
            <span
              className={`grid size-16 shrink-0 place-items-center rounded-2xl text-white shadow-md ${course.tone}`}
            >
              <Icon className="size-7" name="book" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-slate-900">
                {course.title}
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {course.detail}
              </span>
              <span className="mt-2 inline-flex rounded-full bg-[#E7F1EE] px-2.5 py-1 text-[11px] font-bold text-[#0F4F43]">
                {course.lessons}
              </span>
              {enrolledIds.includes(course.id) && (
                <span className="ml-2 mt-2 inline-flex rounded-full bg-[#EDF3E7] px-2.5 py-1 text-[11px] font-bold text-[#3D5F29]">
                  এনরোলড
                </span>
              )}
            </span>
            <Icon
              className="size-4 rotate-180 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#176B5B]"
              name="arrow-left"
            />
          </button>
        ))}
      </section>
    </main>
  )
}

function CourseDetailPage({
  course,
  enrolled,
  onBack,
  onEnroll,
  onOpenDashboard,
}: {
  course: Course
  enrolled: boolean
  onBack: () => void
  onEnroll: () => void
  onOpenDashboard: () => void
}) {
  const tab = course.type
  const price = enrolled
    ? "এনরোলড"
    : course.price === 0
      ? "ফ্রি"
      : `৳ ${formatBanglaNumber(course.price)}`

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-28">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">
          কোর্স ডিটেইলস
        </h1>
      </header>

      <section className="px-5">
        <div
          className={`relative overflow-hidden rounded-[28px] p-5 text-white shadow-lg ${course.tone}`}
        >
          <span className="absolute -right-10 -top-12 size-36 rounded-full border-[22px] border-white/10" />
          <span className="relative grid size-14 place-items-center rounded-2xl bg-white/18 ring-1 ring-white/20">
            <Icon className="size-7" name="book" />
          </span>
          <span className="relative mt-4 inline-flex rounded-full bg-white/18 px-3 py-1 text-[11px] font-bold">
            {tab === "free" ? "ফ্রি কোর্স" : "প্রিমিয়াম কোর্স"}
          </span>
          <h2 className="relative mt-2 text-2xl font-extrabold">
            {course.title}
          </h2>
          <p className="relative mt-1 text-sm text-white/80">{course.detail}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            [formatBanglaNumber(getContent(course.id).modelTests), "মডেল টেস্ট"],
            [
              formatBanglaNumber(course.students + (enrolled ? 1 : 0)),
              "এনরোলড",
            ],
            ["৩ মাস", "মেয়াদ"],
          ].map(([value, label]) => (
            <div
              className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-100"
              key={label}
            >
              <strong className="block text-base text-slate-900">
                {value}
              </strong>
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-base font-bold text-slate-900">কোর্সে যা থাকছে</h3>
          <div className="mt-3 space-y-2.5">
            {getContent(course.id).features.map((feature) => (
              <div
                className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                key={feature}
              >
                <span className="grid size-6 place-items-center rounded-full bg-[#EDF3E7] text-xs font-black text-[#3D5F29]">
                  ✓
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#EAD19C] bg-[#FBF1DD] p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#87580B]">
            <Icon className="size-5" name="calendar" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              কোর্স রুটিন
            </span>
            <span className="mt-0.5 block text-xs text-slate-600">
              ক্লাস ও পরীক্ষার সময়সূচি
            </span>
          </span>
          <a
            className="rounded-xl bg-[#176B5B] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#0F4F43]"
            download={`${course.title}-routine.txt`}
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${course.title} রুটিন\n\nপ্রতিদিন - ডেইলি এক্সাম, সন্ধ্যা ৬টা\nশনি, সোম, বুধ - মডেল টেস্ট, সন্ধ্যা ৬টা থেকে রাত ১২টা\nশুক্রবার - উইকলি এক্সাম ও রিভিউ, রাত ৮টা\n\nবিষয়: ${getContent(course.id).subjects.map((item) => item.name).join(", ")}`)}`}
          >
            ডাউনলোড
          </a>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] items-center justify-between gap-3 rounded-t-2xl border border-b-0 border-slate-200 bg-white/95 py-4 pl-8 pr-5 shadow-[0_-10px_28px_-24px_rgba(23,32,51,0.45)] backdrop-blur">
        <div className="min-w-24">
          <span className="block text-[11px] font-semibold text-slate-500">
            মূল্য
          </span>
          <strong className="text-lg text-slate-900">{price}</strong>
        </div>
        <button
          className={`min-w-44 rounded-full px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 ${
            enrolled ? "bg-[#4F7A35]" : "bg-[#176B5B]"
          }`}
          onClick={enrolled ? onOpenDashboard : onEnroll}
          type="button"
        >
          {enrolled
            ? "পরীক্ষা ড্যাশবোর্ড খুলুন"
            : course.price === 0
              ? "এখনই এনরোল করুন"
              : "কোর্সটি কিনুন"}
        </button>
      </div>
    </main>
  )
}

type WalletMethod = "bkash" | "nagad"

const walletMethods: { id: WalletMethod; label: string; color: string; soft: string }[] = [
  { id: "bkash", label: "bKash", color: "#D12053", soft: "#FCE8EE" },
  { id: "nagad", label: "Nagad", color: "#EC6A20", soft: "#FDEEE4" },
]

function UddoktaPayGateway({
  amount,
  invoiceId,
  onCancel,
  onSuccess,
}: {
  amount: number
  invoiceId: string
  onCancel: () => void
  onSuccess: (method: WalletMethod, account: string) => void
}) {
  const [method, setMethod] = useState<WalletMethod | null>(null)
  const [step, setStep] = useState<"select" | "number" | "otp" | "processing">("select")
  const [account, setAccount] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const wallet = walletMethods.find((item) => item.id === method)
  const digits = (value: string) => value.replace(/\D/g, "")

  const submitNumber = () => {
    if (!/^01[3-9]\d{8}$/.test(account)) {
      setError("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন")
      return
    }
    setError("")
    setStep("otp")
  }

  const submitOtp = () => {
    if (otp !== "123456") {
      setError("OTP সঠিক নয়। ডেমো OTP: 123456")
      return
    }
    setError("")
    setStep("processing")
    window.setTimeout(() => method && onSuccess(method, account), 1500)
  }

  const back = () => {
    setError("")
    if (step === "otp") setStep("number")
    else if (step === "number") {
      setStep("select")
      setMethod(null)
    } else onCancel()
  }

  const fieldClass =
    "h-12 w-full rounded-xl border border-[#D8DEE8] bg-white px-4 text-center text-base font-semibold tracking-wider text-[#1B2433] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#A0A9B8] focus:border-[#1B2433]"

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#EEF1F5]">
      <div className="bg-[#FFF4D6] px-4 py-1.5 text-center text-[11px] font-semibold text-[#7A5A0B]">
        ডেমো পেমেন্ট গেটওয়ে · কোনো টাকা কাটা হবে না
      </div>
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-[0_1px_0_#E3E7EE]">
        <button
          aria-label="পেছনে যান"
          className="grid size-9 place-items-center rounded-full text-[#1B2433] hover:bg-black/5 disabled:opacity-30"
          disabled={step === "processing"}
          onClick={back}
          type="button"
        >
          <Icon className="size-5" name="arrow-left" />
        </button>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-[#1B2433] text-xs font-black text-white">U</span>
          <span className="text-base font-extrabold tracking-tight text-[#1B2433]">
            Uddokta<span className="text-[#2F80ED]">Pay</span>
          </span>
        </div>
        <span className="size-9" />
      </header>

      <div className="flex-1 px-4 py-5">
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-18px_rgba(27,36,51,0.5)]">
          <div className="flex items-center justify-between border-b border-dashed border-[#E3E7EE] px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8792A2]">Merchant</p>
              <p className="mt-0.5 text-sm font-bold text-[#1B2433]">জিকেই একাডেমি</p>
              <p className="mt-0.5 text-[11px] text-[#8792A2]">Invoice: {invoiceId}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8792A2]">Amount</p>
              <p className="mt-0.5 text-xl font-extrabold text-[#1B2433]">৳ {formatBanglaNumber(amount)}</p>
            </div>
          </div>

          <div className="px-4 py-5">
            {step === "select" && (
              <>
                <p className="mb-3 text-sm font-bold text-[#1B2433]">মোবাইল ব্যাংকিং</p>
                <div className="grid grid-cols-2 gap-3">
                  {walletMethods.map((item) => (
                    <button
                      className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#E3E7EE] transition hover:-translate-y-0.5 hover:shadow-md"
                      key={item.id}
                      onClick={() => {
                        setMethod(item.id)
                        setStep("number")
                      }}
                      style={{ backgroundColor: item.soft }}
                      type="button"
                    >
                      <span className="grid size-10 place-items-center rounded-full text-sm font-black text-white" style={{ backgroundColor: item.color }}>
                        {item.label[0]}
                      </span>
                      <span className="text-sm font-extrabold" style={{ color: item.color }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {wallet && step !== "select" && (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-full text-base font-black text-white" style={{ backgroundColor: wallet.color }}>
                  {wallet.label[0]}
                </span>
                <p className="mt-2 text-sm font-extrabold" style={{ color: wallet.color }}>{wallet.label} পেমেন্ট</p>

                {step === "number" && (
                  <div className="mt-4 w-full">
                    <label className="mb-2 block text-xs font-semibold text-[#5B6678]" htmlFor="wallet-number">
                      আপনার {wallet.label} অ্যাকাউন্ট নম্বর দিন
                    </label>
                    <input autoFocus className={fieldClass} id="wallet-number" inputMode="numeric" maxLength={11} onChange={(event) => setAccount(digits(event.target.value).slice(0, 11))} onKeyDown={(event) => event.key === "Enter" && submitNumber()} placeholder="01XXXXXXXXX" value={account} />
                  </div>
                )}

                {step === "otp" && (
                  <div className="mt-4 w-full">
                    <label className="mb-2 block text-xs font-semibold text-[#5B6678]" htmlFor="wallet-otp">
                      {account} নম্বরে পাঠানো ৬ সংখ্যার কোড দিন
                    </label>
                    <input autoFocus className={fieldClass} id="wallet-otp" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(digits(event.target.value).slice(0, 6))} onKeyDown={(event) => event.key === "Enter" && submitOtp()} placeholder="••••••" value={otp} />
                    <p className="mt-2 text-[11px] text-[#8792A2]">ডেমো OTP: 123456</p>
                  </div>
                )}

                {step === "processing" && (
                  <div className="mt-5 flex flex-col items-center gap-3 py-2">
                    <span className="size-9 animate-spin rounded-full border-[3px] border-[#E3E7EE]" style={{ borderTopColor: wallet.color }} />
                    <p className="text-sm font-semibold text-[#5B6678]">পেমেন্ট যাচাই করা হচ্ছে...</p>
                  </div>
                )}

                {error && <p className="mt-3 text-xs font-semibold text-[#C2412D]">{error}</p>}

                {(step === "number" || step === "otp") && (
                  <button
                    className="mt-5 h-12 w-full rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
                    disabled={step === "number" ? account.length !== 11 : otp.length !== 6}
                    onClick={step === "number" ? submitNumber : submitOtp}
                    style={{ backgroundColor: wallet.color }}
                    type="button"
                  >
                    {step === "number" ? "পরবর্তী" : `৳ ${formatBanglaNumber(amount)} নিশ্চিত করুন`}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {step !== "processing" && (
          <button className="mx-auto mt-4 block text-sm font-semibold text-[#5B6678] underline-offset-4 hover:underline" onClick={onCancel} type="button">
            পেমেন্ট বাতিল করুন
          </button>
        )}
      </div>

      <footer className="pb-5 text-center text-[11px] text-[#8792A2]">Secured by UddoktaPay (Demo)</footer>
    </main>
  )
}

function CheckoutPage({
  course,
  onBack,
  onPurchased,
  onOpenDashboard,
}: {
  course: Course
  onBack: () => void
  onPurchased: () => void
  onOpenDashboard: () => void
}) {
  const [coupon, setCoupon] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [couponError, setCouponError] = useState("")
  const [status, setStatus] = useState<"form" | "gateway" | "success">("form")
  const [transactionId] = useState(() => `TXN${Date.now().toString().slice(-8)}`)
  const [invoiceId] = useState(() => `INV-${Date.now().toString().slice(-6)}`)
  const [paidWith, setPaidWith] = useState<{ method: WalletMethod; account: string } | null>(null)
  const [paidAt, setPaidAt] = useState("")

  const discount = appliedCoupon ? Math.round(course.price * 0.1) : 0
  const total = course.price - discount
  const canPay = true
  const includes = [
    ["অন্তর্ভুক্ত", course.lessons],
    ["মেয়াদ", "৩ মাস"],
    ["বিষয়", getContent(course.id).subjects.map((item) => item.name).join(", ")],
  ]

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "GKE10") {
      setAppliedCoupon("GKE10")
      setCouponError("")
    } else {
      setAppliedCoupon("")
      setCouponError("কুপনটি সঠিক নয়")
    }
  }

  const pay = () => {
    if (!canPay || status !== "form") return
    setStatus("gateway")
  }

  if (status === "gateway") {
    return (
      <UddoktaPayGateway
        amount={total}
        invoiceId={invoiceId}
        onCancel={() => setStatus("form")}
        onSuccess={(method, account) => {
          setPaidWith({ method, account })
          setPaidAt(
            new Date().toLocaleString("bn-BD", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          )
          onPurchased()
          setStatus("success")
        }}
      />
    )
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-[#DCE5E3] bg-white px-3 text-sm font-semibold text-[#172321] outline-none placeholder:font-normal placeholder:text-[#9AA7A4] focus:border-[#0E5F63] focus:ring-3 focus:ring-[#D9EFEC]"

  if (status === "success") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#F6F7F4] px-5 pb-6 pt-16">
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-[#DDF2EE] text-[#0E5F63]">
            <Icon className="size-10" name="check-circle" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-[#172321]">কেনা সম্পন্ন হয়েছে</h1>
          <p className="mt-2 text-sm text-[#5E6F6C]">{course.title} কোর্সটি এখন আপনার কোর্সে যোগ হয়েছে।</p>
          <dl className="mt-6 w-full divide-y divide-[#EEF1EF] rounded-2xl border border-[#E1E6E2] bg-white text-sm">
            {[
              ["কোর্স", course.title],
              ["পরিশোধিত", `৳ ${formatBanglaNumber(total)}`],
              [
                "মাধ্যম",
                paidWith
                  ? `${paidWith.method === "bkash" ? "bKash" : "Nagad"} · ${paidWith.account.slice(0, 3)}*****${paidWith.account.slice(-3)}`
                  : "",
              ],
              ["ইনভয়েস", invoiceId],
              ["ট্রানজেকশন আইডি", transactionId],
              ["সময়", paidAt],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between px-4 py-3" key={label}>
                <dt className="text-[#6F7B78]">{label}</dt>
                <dd className="text-right font-semibold text-[#172321]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-[#8A9693]">এটি একটি ডেমো পেমেন্ট, কোনো টাকা কাটা হয়নি।</p>
        </div>
        <button className="h-12 w-full rounded-full bg-[#0E5F63] text-sm font-bold text-white hover:bg-[#0A4C50]" onClick={onOpenDashboard} type="button">
          পরীক্ষা ড্যাশবোর্ড খুলুন
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F6F7F4] pb-32">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-center bg-[#F6F7F4] px-14">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">চেকআউট</h1>
      </header>

      <div className="space-y-3 px-5 pt-1">
        <section className="rounded-2xl border border-[#E1E6E2] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#172321]">অর্ডার সারাংশ</h2>
          <div className="flex items-center gap-3">
            <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-white ${course.tone}`}>
              <Icon className="size-6" name="book" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-[#172321]">{course.title}</span>
              <span className="mt-0.5 block truncate text-xs text-[#6F7B78]">{course.detail}</span>
            </span>
            <strong className="shrink-0 text-base text-[#172321]">৳ {formatBanglaNumber(course.price)}</strong>
          </div>
          <dl className="mt-4 space-y-2 border-t border-[#EEF1EF] pt-3 text-xs">
            {includes.map(([label, value]) => (
              <div className="flex justify-between gap-4" key={label}>
                <dt className="text-[#6F7B78]">{label}</dt>
                <dd className="text-right font-semibold text-[#172321]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-[#E1E6E2] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#172321]">কুপন কোড</h2>
          <div className="flex gap-2">
            <input aria-label="Coupon code" className={`${inputClass} uppercase`} onChange={(event) => setCoupon(event.target.value)} placeholder="যেমন GKE10" value={coupon} />
            <button className="h-11 shrink-0 rounded-xl border border-[#0E5F63] px-4 text-sm font-bold text-[#0E5F63] disabled:opacity-40" disabled={!coupon.trim()} onClick={applyCoupon} type="button">
              প্রয়োগ
            </button>
          </div>
          {appliedCoupon && <p className="mt-2 text-xs font-semibold text-[#0E7A55]">GKE10 প্রয়োগ হয়েছে, ১০% ছাড়</p>}
          {couponError && <p className="mt-2 text-xs font-semibold text-[#B44A3C]">{couponError}</p>}
        </section>

        <section className="rounded-2xl border border-[#E1E6E2] bg-white p-4 text-sm">
          <div className="flex justify-between text-[#4B5B58]">
            <span>কোর্স মূল্য</span>
            <span>৳ {formatBanglaNumber(course.price)}</span>
          </div>
          {discount > 0 && (
            <div className="mt-2 flex justify-between text-[#0E7A55]">
              <span>ছাড়</span>
              <span>− ৳ {formatBanglaNumber(discount)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-[#EEF1EF] pt-3 font-bold text-[#172321]">
            <span>মোট</span>
            <span>৳ {formatBanglaNumber(total)}</span>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] border-t border-[#E1E6E2] bg-white px-5 pb-4 pt-3">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0E5F63] text-sm font-bold text-white transition hover:bg-[#0A4C50] disabled:cursor-not-allowed disabled:bg-[#A9C7C4]" disabled={!canPay} onClick={pay} type="button">
          ৳ {formatBanglaNumber(total)} পরিশোধ করুন
        </button>
        <p className="mt-2 text-center text-[10px] text-[#8A9693]">ডেমো পেমেন্ট · কোনো টাকা কাটা হবে না</p>
      </div>
    </main>
  )
}

const getLiveExams = (short: string, duration: number) => {
  const daily = `${formatBanglaNumber(duration)} মিনিট`
  return [
    { title: `${short} Daily Exam - 1`, duration: daily, questions: "৫০ টি প্রশ্ন", status: "attended" },
    { title: `${short} Daily Exam - 2`, duration: daily, questions: "৫০ টি প্রশ্ন", status: "ended" },
    { title: `${short} Daily Exam - 3`, duration: daily, questions: "৫০ টি প্রশ্ন", status: "ongoing" },
    { title: `${short} Weekly Exam - 1`, duration: "৬০ মিনিট", questions: "১০০ টি প্রশ্ন", status: "ended" },
    { title: `${short} Daily Exam - 4`, duration: daily, questions: "৫০ টি প্রশ্ন", status: "upcoming" },
    { title: `${short} Weekly Exam - 2`, duration: "৬০ মিনিট", questions: "১০০ টি প্রশ্ন", status: "upcoming" },
  ] as const
}

type HistoryType = "all" | "live" | "model" | "practice"

const getExamHistory = (content: CourseContent) => {
  const [first, second] = content.subjects
  return [
    { id: "h1", month: "নভেম্বর ২০২৬", type: "live", title: `${content.short} Daily Exam - 1`, date: "২ নভেম্বর ২০২৬", score: 42, total: 50, correct: 44, wrong: 8, skipped: 0, time: "৪৮ মিনিট", rank: 12 as number | undefined },
    { id: "h2", month: "অক্টোবর ২০২৬", type: "model", title: "Model Test - 03", date: "৩০ অক্টোবর ২০২৬", score: 71, total: 100, correct: 76, wrong: 20, skipped: 4, time: "৫৬ মিনিট", rank: 27 },
    { id: "h3", month: "অক্টোবর ২০২৬", type: "practice", title: `${first.name} Practice`, date: "২৮ অক্টোবর ২০২৬", score: 21, total: 25, correct: 22, wrong: 4, skipped: 0, time: "১৪ মিনিট", rank: undefined },
    { id: "h4", month: "অক্টোবর ২০২৬", type: "live", title: `${content.short} Weekly Exam - 1`, date: "২৫ অক্টোবর ২০২৬", score: 64, total: 100, correct: 69, wrong: 20, skipped: 11, time: "৬০ মিনিট", rank: 41 },
    { id: "h5", month: "অক্টোবর ২০২৬", type: "model", title: "Model Test - 02", date: "২২ অক্টোবর ২০২৬", score: 58, total: 100, correct: 63, wrong: 20, skipped: 17, time: "৫৯ মিনিট", rank: 63 },
    { id: "h6", month: "অক্টোবর ২০২৬", type: "practice", title: `${second.name} Practice`, date: "২০ অক্টোবর ২০২৬", score: 33, total: 50, correct: 36, wrong: 12, skipped: 2, time: "২৮ মিনিট", rank: undefined },
  ] as const
}

const historyTypeLabel = { live: "লাইভ এক্সাম", model: "মডেল টেস্ট", practice: "প্র্যাকটিস" } as const

function ScoreRing({ percent }: { percent: number }) {
  const radius = 19
  const circumference = 2 * Math.PI * radius
  const color = percent >= 80 ? "#0E7A55" : percent >= 60 ? "#0E5F63" : "#B45309"
  return (
    <span className="relative grid size-12 shrink-0 place-items-center">
      <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" fill="none" r={radius} stroke="#EBEFED" strokeWidth="4" />
        <circle cx="24" cy="24" fill="none" r={radius} stroke={color} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} strokeLinecap="round" strokeWidth="4" />
      </svg>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{percent}%</span>
    </span>
  )
}

function ExamHistoryPage({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [filter, setFilter] = useState<HistoryType>("all")
  const examHistory = getExamHistory(getContent(courseId))
  const [openId, setOpenId] = useState<string | null>(null)
  const items = filter === "all" ? examHistory : examHistory.filter((item) => item.type === filter)
  const percentOf = (item: (typeof examHistory)[number]) => Math.round((item.score / item.total) * 100)
  const percentages = examHistory.map(percentOf)
  const average = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
  const best = Math.max(...percentages)
  const trend = [...examHistory].reverse()
  const months = [...new Set(items.map((item) => item.month))]

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F6F7F4] pb-10">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-center bg-[#F6F7F4] px-14">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0E5F63]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">পরীক্ষার ইতিহাস</h1>
      </header>

      <section className="px-5 pt-1">
        <div className="rounded-[20px] bg-[#0E5F63] p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#BDE7E3]">গড় ফল</p>
              <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{average}%</p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <p className="text-xs text-[#BDE7E3]">পরীক্ষা</p>
                <p className="mt-1 text-lg font-bold leading-none tabular-nums">{examHistory.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#BDE7E3]">সেরা</p>
                <p className="mt-1 text-lg font-bold leading-none tabular-nums">{best}%</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex h-16 items-end gap-2" aria-label="সাম্প্রতিক ফলাফল">
            {trend.map((item) => {
              const value = percentOf(item)
              return (
                <div className="flex flex-1 flex-col items-center gap-1" key={item.id}>
                  <span className="text-[9px] tabular-nums text-[#BDE7E3]">{value}</span>
                  <span className={`w-full rounded-md ${item.id === examHistory[0].id ? "bg-white" : "bg-white/30"}`} style={{ height: `${Math.max(value - 40, 8) * 0.7}px` }} />
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] text-[#9FD3CE]">শেষ {examHistory.length}টি পরীক্ষার ফল</p>
        </div>
      </section>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="History filter">
        {(
          [
            ["all", "সব"],
            ["live", "লাইভ এক্সাম"],
            ["model", "মডেল টেস্ট"],
            ["practice", "প্র্যাকটিস"],
          ] as const
        ).map(([id, label]) => (
          <button
            aria-selected={filter === id}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === id ? "bg-[#172321] text-white" : "bg-white text-[#4B5B58] ring-1 ring-[#E1E6E2]"}`}
            key={id}
            onClick={() => setFilter(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 px-5">
        {months.map((month) => (
          <section key={month}>
            <h2 className="pb-2 pt-4 text-xs font-semibold text-[#6F7B78]">{month}</h2>
            <div className="overflow-hidden rounded-2xl border border-[#E1E6E2] bg-white">
              {items
                .filter((item) => item.month === month)
                .map((item, index) => {
                  const percent = percentOf(item)
                  const isOpen = openId === item.id
                  const answered = item.correct + item.wrong + item.skipped
                  return (
                    <article className={index ? "border-t border-[#EEF1EF]" : ""} key={item.id}>
                      <button aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(isOpen ? null : item.id)} type="button">
                        <ScoreRing percent={percent} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#172321]">{item.title}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6F7B78]">
                            <span className="rounded bg-[#F0F3F1] px-1.5 py-0.5 font-semibold text-[#4B5B58]">{historyTypeLabel[item.type]}</span>
                            {item.date}
                          </span>
                        </span>
                        <span className="text-right">
                          <strong className="block text-sm tabular-nums text-[#172321]">{item.score}/{item.total}</strong>
                          <Icon className={`ml-auto mt-1 size-4 text-[#9AA7A4] transition ${isOpen ? "rotate-90" : "-rotate-90"}`} name="arrow-left" />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="rounded-xl bg-[#F6F7F4] p-3">
                            <div className="flex h-1.5 overflow-hidden rounded-full bg-[#E3E8E5]">
                              <span className="bg-[#0E7A55]" style={{ width: `${(item.correct / answered) * 100}%` }} />
                              <span className="bg-[#C2410C]" style={{ width: `${(item.wrong / answered) * 100}%` }} />
                            </div>
                            <dl className="mt-3 grid grid-cols-4 text-center">
                              {[
                                [item.correct, "সঠিক", "text-[#0E7A55]"],
                                [item.wrong, "ভুল", "text-[#C2410C]"],
                                [item.skipped, "বাদ", "text-[#6F7B78]"],
                                [item.rank ? `#${item.rank}` : "—", "র‍্যাঙ্ক", "text-[#172321]"],
                              ].map(([value, label, color]) => (
                                <div key={label}>
                                  <dd className={`text-base font-bold tabular-nums ${color}`}>{value}</dd>
                                  <dt className="text-[10px] text-[#6F7B78]">{label}</dt>
                                </div>
                              ))}
                            </dl>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="flex-1 text-xs text-[#6F7B78]">সময় লেগেছে {item.time}</span>
                            <button className="h-9 rounded-full px-3 text-xs font-bold text-[#0E5F63] hover:bg-[#E5F2F0]" type="button">উত্তর দেখুন</button>
                            <button className="h-9 rounded-full bg-[#0E5F63] px-4 text-xs font-bold text-white hover:bg-[#0A4C50]" type="button">আবার দিন</button>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function AttendExamPage({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [filter, setFilter] = useState<"all" | "ongoing" | "upcoming">("all")
  const content = getContent(courseId)
  const liveExams = getLiveExams(content.short, content.duration)
  const exams =
    filter === "all"
      ? liveExams
      : liveExams.filter((exam) => exam.status === filter)
  const statusView = {
    attended: {
      label: "অংশগ্রহণকৃত",
      action: "পরীক্ষা সম্পন্ন",
      box: "bg-[#EEF5FF]",
      text: "text-[#2563B8]",
      icon: "check-circle" as IconName,
    },
    ended: {
      label: "সমাপ্ত",
      action: "পরীক্ষা সম্পন্ন",
      box: "bg-[#F1F4F8]",
      text: "text-[#64748B]",
      icon: "check-circle" as IconName,
    },
    ongoing: {
      label: "চলমান",
      action: "পরীক্ষা দিন",
      box: "bg-[#EAF7F0]",
      text: "text-[#03543F]",
      icon: "clock" as IconName,
    },
    upcoming: {
      label: "আসন্ন",
      action: "১০ নভেম্বর, ৬:০০ PM",
      box: "bg-[#FFF7E8]",
      text: "text-[#A35B00]",
      icon: "calendar" as IconName,
    },
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F8FAFC] pb-8">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-center border-b border-[#E5E7EB] bg-white px-14">
        <button
          aria-label="পেছনে যান"
          className="absolute left-4 grid size-10 place-items-center rounded-full text-[#111827] hover:bg-black/5"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-xl font-bold text-[#111827]">লাইভ এক্সাম</h1>
      </header>

      <div className="flex items-center justify-between gap-3 px-3 py-5">
        <div
          className="flex rounded-full border border-[#E2E8F0] bg-white p-1"
          role="tablist"
          aria-label="Exam filter"
        >
          {[
            ["all", "All"],
            ["ongoing", "Ongoing"],
            ["upcoming", "Upcoming"],
          ].map(([id, label]) => (
            <button
              aria-selected={filter === id}
              className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                filter === id ? "bg-[#03543F] text-white" : "text-[#64748B]"
              }`}
              key={id}
              onClick={() => setFilter(id as "all" | "ongoing" | "upcoming")}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <a
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm font-bold text-[#1D4ED8]"
          download={`${content.short}-exam-routine.txt`}
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${content.category} লাইভ এক্সাম রুটিন\n\nDaily Exam - প্রতিদিন সন্ধ্যা ৬টা\nWeekly Exam - শুক্রবার সন্ধ্যা ৬টা`)}`}
        >
          <Icon className="size-4" name="calendar" />
          রুটিন
        </a>
      </div>

      <section className="space-y-3 px-3">
        {exams.map((exam) => {
          const view = statusView[exam.status]
          return (
            <article
              className="rounded-2xl border border-[#E2E8F0] bg-white p-4"
              key={exam.title}
            >
              <h2 className="text-lg font-bold text-[#111827]">{exam.title}</h2>
              <div className="mt-3 flex items-center justify-between text-sm text-[#374151]">
                <span className="flex items-center gap-2">
                  <Icon className="size-5 text-[#DC2626]" name="clock" />
                  {exam.duration}
                </span>
                <span className="flex items-center gap-2">
                  <Icon className="size-5 text-[#10B981]" name="file" />
                  {exam.questions}
                </span>
              </div>
              <div
                className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 ${view.box}`}
              >
                <span
                  className={`flex items-center gap-2 text-sm font-semibold ${view.text}`}
                >
                  <Icon className="size-5" name={view.icon} />
                  {view.label}
                </span>
                {exam.status === "ongoing" ? (
                  <button
                    className="rounded-full bg-[#03543F] px-4 py-1.5 text-sm font-bold text-white"
                    type="button"
                  >
                    {view.action}
                  </button>
                ) : (
                  <span className="text-sm font-bold text-[#111827]">
                    {view.action}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}

const modelTestTones = [
  "bg-[#176B5B]",
  "bg-[#7B3F61]",
  "bg-[#2D6F8E]",
  "bg-[#D85B4A]",
  "bg-[#4F7A35]",
]

function ModelTestsPage({
  courseId,
  onBack,
  onOpenTest,
}: {
  courseId: string
  onBack: () => void
  onOpenTest: (number: string) => void
}) {
  const count = getContent(courseId).modelTests
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-10">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">
          Model Tests
        </h1>
      </header>

      <section className="px-4" aria-labelledby="model-tests-title">
        <div className="mb-4 flex items-end justify-between px-1">
          <div>
            <h2
              className="text-base font-bold text-slate-900"
              id="model-tests-title"
            >
              All Model Tests
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              চালিয়ে যেতে একটি টেস্ট বেছে নিন
            </p>
          </div>
          <span className="rounded-full bg-[#E7F1EE] px-3 py-1 text-xs font-bold text-[#176B5B]">
            {count} Tests
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: count }, (_, index) => {
            const number = String(index + 1).padStart(2, "0")
            return (
              <button
                aria-label={`Model Test ${index + 1}`}
                className={`group relative flex aspect-[1.05] flex-col items-center justify-center overflow-hidden rounded-3xl text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B] ${modelTestTones[index % modelTestTones.length]}`}
                key={number}
                onClick={() => onOpenTest(number)}
                type="button"
              >
                <span className="absolute -right-5 -top-5 size-14 rounded-full border-[10px] border-white/15" />
                <span className="relative text-[10px] font-bold uppercase tracking-wider text-white/75">
                  Model Test
                </span>
                <span className="relative mt-1 text-2xl font-extrabold leading-none">
                  {number}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

const attempts = [
  { title: "Attempt 2", date: "28 Oct 2026", score: 78, time: "52 min" },
  { title: "Attempt 1", date: "24 Oct 2026", score: 64, time: "58 min" },
]

const leaderboard = [
  { name: "Ayesha Rahman", score: 96, rank: 1 },
  { name: "Tanvir Hasan", score: 93, rank: 2 },
  { name: "Nusrat Jahan", score: 91, rank: 3 },
  { name: "You", score: 78, rank: 18 },
]

function ModelTestDetailPage({
  courseId,
  number,
  onBack,
}: {
  courseId: string
  number: string
  onBack: () => void
}) {
  const content = getContent(courseId)
  const total = totalQuestions(content)
  const subjectBreakdown = content.subjects.map((item, index) => ({
    subject: item.name,
    questions: item.questions,
    color: subjectColors[index % subjectColors.length],
  }))
  const [activeTab, setActiveTab] = useState<"attempts" | "leaderboard">(
    "attempts",
  )

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFAF3] pb-10">
      <header className="sticky top-0 z-30 mb-4 flex h-16 items-center justify-center px-14 bg-inherit">
        <button
          aria-label="পেছনে যান"
          className="absolute left-3 grid size-10 place-items-center rounded-full text-slate-800 transition hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
          onClick={onBack}
          type="button"
        >
          <Icon className="size-6" name="arrow-left" />
        </button>
        <h1 className="truncate text-lg font-bold text-slate-900">
          MT-{number}
        </h1>
      </header>

      <section className="px-5">
        <article className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_38px_-28px_rgba(23,107,91,0.65)] ring-1 ring-[#E7F1EE]">
          <div className="relative overflow-hidden bg-[#2D6F8E] px-4 py-3.5 text-white">
            <span className="absolute -right-10 -top-12 size-28 rounded-full border-[18px] border-white/10" />
            <span className="relative inline-flex rounded-full bg-white/18 px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-white/20">
              {content.category}
            </span>
            <h2 className="relative mt-1.5 text-lg font-extrabold">
              {content.short} Model Test {number}
            </h2>
            <div className="relative mt-3 grid grid-cols-3 gap-1.5 text-center">
              {[
                [String(total), "Questions"],
                [String(total), "Marks"],
                [`${content.duration} min`, "Duration"],
              ].map(([value, label]) => (
                <span
                  className="rounded-xl bg-white/15 px-1.5 py-1.5 ring-1 ring-white/15"
                  key={label}
                >
                  <strong className="block text-sm leading-none">
                    {value}
                  </strong>
                  <span className="mt-0.5 block text-[9px] font-semibold text-white/75">
                    {label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                বিষয়ভিত্তিক প্রশ্ন
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Total {total}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {subjectBreakdown.map((item) => (
                <div
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5"
                  key={item.subject}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${item.color}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                    {item.subject}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {item.questions} Q
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl bg-[#176B5B] px-3 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
                type="button"
              >
                Start Exam
              </button>
              <button
                className="rounded-xl border border-[#B9D6CF] bg-[#E7F1EE] px-3 py-2.5 text-sm font-bold text-[#0F4F43] transition hover:-translate-y-0.5 hover:bg-[#E7F1EE] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176B5B]"
                type="button"
              >
                Practice
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 px-5">
        <div
          className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1"
          role="tablist"
          aria-label="মডেল টেস্ট কার্যক্রম"
        >
          {[
            ["attempts", "My Attempts"],
            ["leaderboard", "Leaderboard"],
          ].map(([id, label]) => (
            <button
              aria-selected={activeTab === id}
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                activeTab === id
                  ? "bg-white text-[#0F4F43] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              key={id}
              onClick={() => setActiveTab(id as "attempts" | "leaderboard")}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3" role="tabpanel">
          {activeTab === "attempts" ? (
            attempts.map((attempt) => (
              <div
                className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                key={attempt.title}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {attempt.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {attempt.date} · {attempt.time}
                  </p>
                </div>
                <span className="rounded-full bg-[#EDF3E7] px-3 py-1.5 text-sm font-extrabold text-[#4F7A35]">
                  {Math.round((attempt.score / 100) * total)}/{total}
                </span>
              </div>
            ))
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-xs font-semibold text-[#6B7280]">
                <span>র‍্যাঙ্ক ও শিক্ষার্থী</span>
                <span>নম্বর</span>
              </div>
              <div className="divide-y divide-[#F0F1F2]">
                {leaderboard.map((student) => (
                  <LeaderboardRow
                    key={student.name}
                    scoreLabel="score"
                    student={student}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export interface CourseSystemViewProps {
  commonLayoutProps?: any;
}

export default function CourseSystemView({ commonLayoutProps }: CourseSystemViewProps = {}) {
  const [page, setPage] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""))
  const [enrolledIds, setEnrolledIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["gke-batch"]
    try {
      const saved = JSON.parse(
        localStorage.getItem(ENROLLMENT_STORAGE_KEY) ?? '["gke-batch"]',
      )
      return Array.isArray(saved)
        ? saved.filter((id) => typeof id === "string" && getCourse(id))
        : ["gke-batch"]
    } catch {
      return ["gke-batch"]
    }
  })

  const [activeCourseId, setActiveCourseId] = useState(() => {
    if (typeof window === "undefined") return "gke-batch"
    const saved = localStorage.getItem(ACTIVE_COURSE_STORAGE_KEY)
    return saved && getCourse(saved) ? saved : "gke-batch"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(enrolledIds))
    }
  }, [enrolledIds])

  useEffect(() => {
    const match = page.match(/^#course-dashboard-([a-z-]+)$/)
    if (match && getCourse(match[1])) {
      setActiveCourseId(match[1])
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_COURSE_STORAGE_KEY, match[1])
      }
    }
  }, [page])

  useEffect(() => {
    if (typeof window === "undefined") return
    const updatePage = () => setPage(window.location.hash)
    window.addEventListener("hashchange", updatePage)
    return () => window.removeEventListener("hashchange", updatePage)
  }, [])

  const goBack = () => {
    if (page === "" || page === "#courses") {
      if (commonLayoutProps?.onBack) {
        commonLayoutProps.onBack()
        return
      } else if (commonLayoutProps?.onTabChange) {
        commonLayoutProps.onTabChange("dashboard")
        return
      }
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.hash = page.startsWith("#checkout-")
        ? page.replace("#checkout-", "course-")
        : page.startsWith("#course-")
        ? "courses"
        : page.startsWith("#model-test-")
          ? "model-tests"
          : page === "#model-tests" ||
              page === "#leaderboard" ||
              page === "#practice" ||
              page === "#materials" ||
              page === "#attend-exam" ||
              page === "#exam-history"
            ? `course-dashboard-${activeCourseId}`
            : ""
    }
  }

  const modelTestMatch = page.match(/^#model-test-(\d{2})$/)
  if (modelTestMatch)
    return <ModelTestDetailPage courseId={activeCourseId} key={activeCourseId} number={modelTestMatch[1]} onBack={goBack} />
  if (page === "#leaderboard") return <LeaderboardPage courseId={activeCourseId} key={activeCourseId} onBack={goBack} />
  if (page === "#practice") return <PracticePage courseId={activeCourseId} key={activeCourseId} onBack={goBack} />
  if (page === "#materials") return <MaterialsPage courseId={activeCourseId} key={activeCourseId} onBack={goBack} />
  if (page === "#attend-exam") return <AttendExamPage courseId={activeCourseId} key={activeCourseId} onBack={goBack} />
  if (page === "#exam-history") return <ExamHistoryPage courseId={activeCourseId} key={activeCourseId} onBack={goBack} />
  const courseDashboardMatch = page.match(/^#course-dashboard-([a-z-]+)$/)
  if (courseDashboardMatch) {
    const course = getCourse(courseDashboardMatch[1])
    if (course && enrolledIds.includes(course.id)) {
      return (
        <ExamDashboard
          courseId={course.id}
          courseTitle={course.title}
          onBack={goBack}
          onOpenLeaderboard={() => (window.location.hash = "leaderboard")}
          onOpenMaterials={() => (window.location.hash = "materials")}
          onOpenAttendExam={() => (window.location.hash = "attend-exam")}
          onOpenHistory={() => (window.location.hash = "exam-history")}
          onOpenModelTests={() => (window.location.hash = "model-tests")}
          onOpenPractice={() => (window.location.hash = "practice")}
        />
      )
    }
    if (course) window.location.replace(`#course-${course.id}`)
  }
  const checkoutMatch = page.match(/^#checkout-([a-z-]+)$/)
  const checkoutCourse = checkoutMatch ? getCourse(checkoutMatch[1]) : undefined
  if (checkoutCourse && checkoutCourse.price > 0) {
    return (
      <CheckoutPage
        course={checkoutCourse}
        onBack={goBack}
        onOpenDashboard={() =>
          window.location.replace(`#course-dashboard-${checkoutCourse.id}`)
        }
        onPurchased={() =>
          setEnrolledIds((current) =>
            current.includes(checkoutCourse.id)
              ? current
              : [...current, checkoutCourse.id],
          )
        }
      />
    )
  }
  const courseMatch = page.match(/^#course-([a-z-]+)$/)
  const selectedCourse = courseMatch ? getCourse(courseMatch[1]) : undefined
  if (selectedCourse) {
    return (
      <CourseDetailPage
        course={selectedCourse}
        enrolled={enrolledIds.includes(selectedCourse.id)}
        onBack={goBack}
        onEnroll={() =>
          selectedCourse.price === 0
            ? setEnrolledIds((current) =>
                current.includes(selectedCourse.id)
                  ? current
                  : [...current, selectedCourse.id],
              )
            : (window.location.hash = `checkout-${selectedCourse.id}`)
        }
        onOpenDashboard={() =>
          (window.location.hash = `course-dashboard-${selectedCourse.id}`)
        }
      />
    )
  }
  if (page === "#courses") {
    return (
      <CoursesPage
        enrolledIds={enrolledIds}
        onBack={goBack}
        onOpenCourse={(id) =>
          (window.location.hash = enrolledIds.includes(id)
            ? `course-dashboard-${id}`
            : `course-${id}`)
        }
      />
    )
  }
  if (page === "#model-tests") {
    return (
      <ModelTestsPage
        courseId={activeCourseId}
        onBack={goBack}
        onOpenTest={(number) => (window.location.hash = `model-test-${number}`)}
      />
    )
  }
  if (page === "#exam-batch") {
    window.location.replace(`#course-dashboard-${activeCourseId}`)
    return null
  }
  return <BatchHome onOpenCourses={() => (window.location.hash = "courses")} />
}
