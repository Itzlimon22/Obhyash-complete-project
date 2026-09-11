import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "../dashboard/DashboardClient";

export default async function HistoryRoutePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: dbProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: subjectsData } = await supabase.from("subjects").select("*");
  const subjects = subjectsData || [];

  const userProfile = dbProfile
    ? {
        ...dbProfile,
        streakCount: dbProfile.streak || dbProfile.streak_count || 0,
        lastStreakDate: dbProfile.last_streak_date,
        examsTaken: dbProfile.exams_taken || 0,
        enrolledExams: dbProfile.enrolled_exams || 0,
        avatarUrl: dbProfile.avatar_url,
        avatarColor: dbProfile.avatar_color,
        createdAt: dbProfile.created_at,
        role: dbProfile.role || "Student",
        status: dbProfile.status || "Active",
        xp: dbProfile.xp || 0,
        level: dbProfile.level || "Beginner",
        subscription: dbProfile.subscription || {
          plan: "Free",
          status: "Active",
          expiry: "",
        },
        recentExams: [],
      }
    : {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "Student",
        role: "Student",
        status: "Active",
        xp: 0,
        level: "Beginner",
        examsTaken: 0,
        enrolledExams: 0,
        subscription: { plan: "Free", status: "Active", expiry: "" },
        recentExams: [],
      };

  return (
    <DashboardClient
      user={userProfile}
      subjects={subjects}
      initialTab="history"
    />
  );
}
