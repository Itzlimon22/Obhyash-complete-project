import React, { useState } from 'react';
import {
  User,
  Edit,
  X,
  Mail,
  Phone,
  Shield,
  UserCheck,
  BookOpen,
  Layers,
  GraduationCap,
  Trophy,
  Calendar,
  MapPin,
  Flame,
  Target,
  Save,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { User as UserType, UserRole, UserStatus } from '@/lib/types';

interface EditUserModalProps {
  user?: Partial<UserType>;
  onClose: () => void;
  onSuccess: () => void;
}

type TabKey = 'general' | 'academic' | 'ssc' | 'personal' | 'gamification';

export default function EditUserModal({
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: user?.id || '',
    student_id: user?.student_id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: (user?.role || 'Student') as UserRole,
    status: (user?.status || 'Active') as UserStatus,
    avatarUrl: user?.avatarUrl || '',
    avatarColor: user?.avatarColor || 'bg-slate-500',

    // Academic Details
    institute: user?.institute || '',
    division: user?.division || '',
    batch: user?.batch || '',
    stream: user?.stream || '',
    target: user?.target || '',
    goal: user?.goal || '',
    exam_target: user?.exam_target || '',
    batch_change_count: user?.batch_change_count ?? 0,

    // SSC Information
    ssc_roll: user?.ssc_roll || '',
    ssc_reg: user?.ssc_reg || '',
    ssc_board: user?.ssc_board || '',
    ssc_passing_year: user?.ssc_passing_year || '',
    optional_subject: user?.optional_subject || '',

    // Personal Information
    gender: user?.gender || '',
    dob: user?.dob || '',
    address: user?.address || '',
    bio: user?.bio || '',

    // Gamification
    xp: user?.xp ?? 0,
    level: user?.level || 'Beginner',
    streakCount: user?.streakCount ?? 0,
    daily_exams_goal: user?.daily_exams_goal ?? 3,
  });

  const handleSave = async () => {
    if (!formData.id) return;
    setIsSaving(true);
    const supabase = createClient();

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status,
        avatar_url: formData.avatarUrl.trim() || null,
        avatar_color: formData.avatarColor,

        // Academic
        institute: formData.institute.trim() || null,
        division: formData.division || null,
        batch: formData.batch.trim() || null,
        stream: formData.stream || null,
        target: formData.target.trim() || null,
        goal: formData.goal || null,
        exam_target: formData.exam_target || null,
        batch_change_count: Number(formData.batch_change_count) || 0,

        // SSC
        ssc_roll: formData.ssc_roll.trim() || null,
        ssc_reg: formData.ssc_reg.trim() || null,
        ssc_board: formData.ssc_board || null,
        ssc_passing_year: formData.ssc_passing_year || null,
        optional_subject: formData.optional_subject.trim() || null,

        // Personal
        gender: formData.gender || null,
        dob: formData.dob || null,
        address: formData.address.trim() || null,
        bio: formData.bio.trim() || null,

        // Gamification
        xp: Number(formData.xp) || 0,
        level: formData.level || 'Beginner',
        streak: Number(formData.streakCount) || 0,
        daily_exams_goal: Number(formData.daily_exams_goal) || 3,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', formData.id);

      if (error) throw error;

      // Log activity
      try {
        await supabase.from('user_activity_log').insert({
          user_id: formData.id,
          activity_type: 'ADMIN_PROFILE_UPDATE',
          description: `Admin updated profile details for ${formData.name || formData.email}`,
          metadata: {
            updated_fields: Object.keys(payload),
          },
          created_at: new Date().toISOString(),
        });
      } catch (_) {}

      toast.success('User profile updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.message || 'Failed to update user profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'general', label: 'General & Role', icon: User },
    { id: 'academic', label: 'Academic & Track', icon: BookOpen },
    { id: 'ssc', label: 'SSC Record', icon: GraduationCap },
    { id: 'personal', label: 'Personal Details', icon: MapPin },
    { id: 'gamification', label: 'XP & Rewards', icon: Trophy },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Edit User Profile
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  {formData.student_id || `ID: ${formData.id.slice(0, 8)}`}
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Update account details, academic information, and gamification stats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 px-4 pt-2 gap-1 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: GENERAL & IDENTITY */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Account Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Account Status
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC & TRACK */}
          {activeTab === 'academic' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    College / Institute
                  </label>
                  <input
                    type="text"
                    value={formData.institute}
                    onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                    placeholder="e.g. Notre Dame College, Dhaka"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Academic Batch
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g. HSC 2026, HSC 2025"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Division / Group
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Group</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Business Studies / Commerce</option>
                    <option value="Humanities">Humanities / Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Stream / Preparation Goal
                  </label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Stream</option>
                    <option value="HSC">HSC Preparation</option>
                    <option value="Admission">University Admission</option>
                    <option value="SSC">SSC Preparation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Admission Target Focus
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="e.g. Engineering (BUET), Medical (MBBS), DU A"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Exam Target Tag
                  </label>
                  <input
                    type="text"
                    value={formData.exam_target}
                    onChange={(e) => setFormData({ ...formData, exam_target: e.target.value })}
                    placeholder="e.g. hsc_2026, mbbs_2026"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Batch Change Count (Lock: max 1)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={formData.batch_change_count}
                      onChange={(e) =>
                        setFormData({ ...formData, batch_change_count: parseInt(e.target.value) || 0 })
                      }
                      className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, batch_change_count: 0 })}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Reset to 0 (Unlock for Student)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SSC RECORD */}
          {activeTab === 'ssc' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                Official Secondary School Certificate (SSC) credentials for student verification and leaderboard authenticity.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    SSC Roll Number
                  </label>
                  <input
                    type="text"
                    value={formData.ssc_roll}
                    onChange={(e) => setFormData({ ...formData, ssc_roll: e.target.value })}
                    placeholder="e.g. 104928"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    SSC Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.ssc_reg}
                    onChange={(e) => setFormData({ ...formData, ssc_reg: e.target.value })}
                    placeholder="e.g. 1912839281"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    SSC Board
                  </label>
                  <select
                    value={formData.ssc_board}
                    onChange={(e) => setFormData({ ...formData, ssc_board: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Education Board</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Cumilla">Cumilla</option>
                    <option value="Jashore">Jashore</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Dinajpur">Dinajpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                    <option value="Madrasah">Madrasah</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Passing Year
                  </label>
                  <input
                    type="text"
                    value={formData.ssc_passing_year}
                    onChange={(e) => setFormData({ ...formData, ssc_passing_year: e.target.value })}
                    placeholder="e.g. 2024, 2023"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    4th / Optional Subject
                  </label>
                  <input
                    type="text"
                    value={formData.optional_subject}
                    onChange={(e) => setFormData({ ...formData, optional_subject: e.target.value })}
                    placeholder="e.g. Higher Mathematics, Biology, Agriculture"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Address / District
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Dhanmondi, Dhaka"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Bio / Status Line
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Short bio or personal motto..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GAMIFICATION & STATS */}
          {activeTab === 'gamification' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Trophy size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Adjust user experience points (XP), leaderboard ranking tier, streak continuity, or daily goals. Use with care for customer support corrections.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    Total XP Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.xp}
                    onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Leaderboard Level / Rank
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Beginner">Beginner (Rookie)</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Master">Master</option>
                    <option value="Grandmaster">Grandmaster</option>
                    <option value="Legend">Legend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Flame size={14} className="text-red-500" />
                    Active Streak Count (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.streakCount}
                    onChange={(e) =>
                      setFormData({ ...formData, streakCount: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Target size={14} className="text-emerald-500" />
                    Daily Exams Goal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.daily_exams_goal}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_exams_goal: parseInt(e.target.value) || 3 })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
            All updates are saved to database with admin audit logs.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
