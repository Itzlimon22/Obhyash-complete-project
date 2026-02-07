import React, { useState } from 'react';
import Image from 'next/image';
import { useFileUpload } from '@/hooks/use-file-upload'; // ✅ Import File Upload Hook
import {
  X,
  UserPlus,
  Save,
  Loader2,
  Edit2,
  GraduationCap,
  Lock,
  LucideIcon,
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: Partial<User>) => Promise<void>;
}

// --- Tab Button ---
const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-1 justify-center whitespace-nowrap ${
      active
        ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

// --- Input Helper ---
const InputGroup = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-4 py-2.5 rounded-lg bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full px-4 py-2.5 rounded-lg bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none dark:text-white transition-all"
  />
);

// --- Form Component ---
const UserForm = ({
  user,
  onSave,
}: {
  user: User | null;
  onSave: (data: Partial<User>) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Partial<User>>(
    user || { role: 'Student', status: 'Active' },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'personal' | 'academic' | 'security'
  >('personal');

  // ✅ Hook Integration
  const { uploadFile, isUploading } = useFileUpload();

  // ✅ Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadFile(file); // Upload to R2
      if (url) {
        setFormData((prev) => ({ ...prev, avatarUrl: url })); // Update state with public URL
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name) return alert('নাম আবশ্যক');
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-obsidian-900 animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900 shrink-0">
        <TabButton
          active={activeTab === 'personal'}
          onClick={() => setActiveTab('personal')}
          icon={Edit2}
          label="ব্যক্তিগত তথ্য"
        />
        <TabButton
          active={activeTab === 'academic'}
          onClick={() => setActiveTab('academic')}
          icon={GraduationCap}
          label="একাডেমিক"
        />
        <TabButton
          active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
          icon={Lock}
          label="লিংকিং ও পাসওয়ার্ড"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* ✅ Avatar Upload UI */}
            <div className="flex items-center gap-5 p-4 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-paper-50/50 dark:bg-obsidian-950/50">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-obsidian-900 overflow-hidden border-2 border-paper-200 dark:border-obsidian-700 shadow-sm relative group shrink-0">
                {formData.avatarUrl ? (
                  <Image
                    src={formData.avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserPlus size={28} />
                  </div>
                )}
                {/* Loading Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 className="animate-spin text-white" size={20} />
                  </div>
                )}
              </div>

              <div>
                <label
                  className={`px-4 py-2 bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-obsidian-800 transition-colors shadow-sm flex items-center gap-2 w-fit ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploading ? 'আপলোড হচ্ছে...' : 'ছবি পরিবর্তন করুন'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[10px] text-gray-400 mt-2">
                  Max size 2MB (PNG, JPG). <br /> Recommended: 300x300px.
                </p>
              </div>
            </div>

            {/* Existing Form Fields */}
            <div className="space-y-5">
              <InputGroup label="নাম (Name)">
                <StyledInput
                  value={formData.name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Limon"
                />
              </InputGroup>

              <InputGroup label="জন্ম তারিখ (Date of Birth)">
                <StyledInput
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                />
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="ছাত্র/ছাত্রী (Gender)">
                  <StyledSelect
                    value={formData.gender || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male (ছাত্র)</option>
                    <option value="Female">Female (ছাত্রী)</option>
                  </StyledSelect>
                </InputGroup>

                <InputGroup label="রোল (Role)">
                  <StyledSelect
                    value={formData.role || 'Student'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </StyledSelect>
                </InputGroup>
              </div>

              <InputGroup label="ঠিকানা (Address)">
                <textarea
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-paper-50 dark:bg-obsidian-950 border border-paper-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none dark:text-white transition-all resize-none min-h-[80px]"
                  placeholder="সম্পূর্ণ ঠিকানা লিখুন..."
                />
              </InputGroup>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <InputGroup label="শিক্ষা প্রতিষ্ঠানের নাম">
              <StyledInput
                value={formData.institute || ''}
                onChange={(e) =>
                  setFormData({ ...formData, institute: e.target.value })
                }
                placeholder="তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো..."
              />
            </InputGroup>

            <InputGroup label="কী নিয়ে চর্চা করতে চাও? (Goal)">
              <StyledSelect
                value={formData.goal || ''}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
              >
                <option value="">Select Goal</option>
                <option value="HSC">HSC</option>
                <option value="Admission">Admission</option>
              </StyledSelect>
            </InputGroup>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="বিভাগ (Division)">
                <StyledSelect
                  value={formData.division || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, division: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Business Studies">Business Studies</option>
                </StyledSelect>
              </InputGroup>

              <InputGroup label="ব্যাচ (Batch)">
                <StyledSelect
                  value={formData.batch || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, batch: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="HSC 2024">HSC 2024</option>
                  <option value="HSC 2025">HSC 2025</option>
                  <option value="HSC 2026">HSC 2026</option>
                </StyledSelect>
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="এসএসসি রোল নম্বর">
                <StyledInput
                  value={formData.ssc_roll || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ssc_roll: e.target.value })
                  }
                />
              </InputGroup>
              <InputGroup label="এসএসসি রেজিস্ট্রেশন নম্বর">
                <StyledInput
                  value={formData.ssc_reg || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ssc_reg: e.target.value })
                  }
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="এসএসসি বোর্ড">
                <StyledSelect
                  value={formData.ssc_board || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ssc_board: e.target.value })
                  }
                >
                  <option value="">Select Board</option>
                  <option value="Dhaka">Dhaka</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Comilla">Comilla</option>
                  <option value="Jessore">Jessore</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Barisal">Barisal</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Dinajpur">Dinajpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                  <option value="Madrasah">Madrasah</option>
                </StyledSelect>
              </InputGroup>
              <InputGroup label="এসএসসি পাসিং ইয়ার">
                <StyledSelect
                  value={formData.ssc_passing_year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ssc_passing_year: e.target.value,
                    })
                  }
                >
                  <option value="">Select Year</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </StyledSelect>
              </InputGroup>
            </div>

            <InputGroup label="Optional Subject">
              <StyledInput
                value={formData.optional_subject || ''}
                onChange={(e) =>
                  setFormData({ ...formData, optional_subject: e.target.value })
                }
                placeholder="Higher Math / Biology..."
              />
            </InputGroup>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Account Linking Section */}
            <div className="p-4 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-paper-50/50 dark:bg-obsidian-950/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                অ্যাকাউন্ট লিংকিং
              </h3>
              <div className="space-y-4">
                <InputGroup label="Email">
                  <div className="relative">
                    <StyledInput
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled // Email usually managed via Auth
                    />
                    <div className="absolute right-3 top-2.5 text-emerald-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </InputGroup>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-obsidian-900 border border-paper-200 dark:border-obsidian-800 rounded-lg">
                  <span className="text-sm font-medium dark:text-gray-300">
                    লিংক অ্যাকাউন্ট
                  </span>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-paper-100 dark:bg-obsidian-800 px-3 py-1.5 rounded-full border border-paper-200 dark:border-obsidian-700">
                      <span className="text-xs font-bold">G</span>{' '}
                      <span className="text-emerald-500 text-xs">✔</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="p-4 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-paper-50/50 dark:bg-obsidian-950/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                পাসওয়ার্ড পরিবর্তন
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                পরিবর্তন করতে না চাইলে খালি রাখো
              </p>

              <div className="space-y-4">
                <InputGroup label="New Password">
                  <StyledInput type="password" placeholder="••••••••" />
                </InputGroup>
                <InputGroup label="Confirm New Password">
                  <StyledInput type="password" placeholder="••••••••" />
                </InputGroup>
              </div>
              <p className="text-[10px] text-amber-500 mt-2">
                * Note: As an Admin, use the &quot;Reset Password&quot; email
                trigger in production.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="p-6 border-t border-paper-200 dark:border-obsidian-800 bg-paper-50 dark:bg-obsidian-950 shrink-0 flex gap-3">
        <button
          className="flex-1 py-2.5 rounded-lg border border-paper-300 dark:border-obsidian-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-obsidian-800 transition-colors"
          onClick={() => {
            /* Handled by parent */
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// --- Wrapper ---
export const UserDrawer: React.FC<UserDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-pointer-events ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-white dark:bg-obsidian-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-paper-200 dark:border-obsidian-800 flex flex-col ${isOpen ? 'tranneutral-x-0' : 'tranneutral-x-full'}`}
      >
        <div className="p-6 border-b border-paper-200 dark:border-obsidian-800 bg-paper-50 dark:bg-obsidian-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg">
              {user ? user.name.charAt(0) : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-paper-900 dark:text-white leading-tight">
                {user ? user.name : 'নতুন ইউজার'}
              </h2>
              <span className="text-xs text-gray-500">
                {user ? 'প্রোফাইল এডিট করুন' : 'নতুন একাউন্ট তৈরি'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-obsidian-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 h-full overflow-hidden">
          <UserForm
            key={user ? user.id : 'new-user'}
            user={user}
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  );
};
