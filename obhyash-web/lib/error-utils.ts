export const getErrorMessage = (error: unknown): string => {
  const message =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error && typeof (error as Record<string, unknown>).message === 'string'
        ? (error as { message: string }).message
        : 'Something went wrong';

  // Auth & Password Errors
  if (
    message.includes('New password should be different from the old password')
  ) {
    return 'নতুন পাসওয়ার্ডটি পুরাতন পাসওয়ার্ড থেকে আলাদা হতে হবে।';
  }
  if (message.includes('Invalid login credentials')) {
    return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
  }
  if (message.includes('Email not confirmed')) {
    return 'আপনার ইমেইলটি এখনও ভেরিফাই করা হয়নি।';
  }
  if (message.includes('User already registered')) {
    return 'এই ইমেইল দিয়ে ইতঃমধ্যেই অ্যাকাউন্ট খোলা হয়েছে।';
  }
  if (message.includes('Password should be at least 6 characters')) {
    return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  }

  // File Upload Errors
  if (message.includes('file too large') || message.includes('2 megabytes')) {
    return 'ফাইলের সাইজ অনেক বড় (সর্বোচ্চ ২ এমবি)।';
  }
  if (message.includes('Upload failed') || message.includes('uploading')) {
    return 'আপলোড ব্যর্থ হয়েছে, আবার চেষ্টা করুন।';
  }

  // General Database/API Errors
  if (message.includes('Failed to load') || message.includes('loading')) {
    return 'তথ্য লোড করতে সমস্যা হয়েছে।';
  }
  if (message.includes('Failed to update') || message.includes('updating')) {
    return 'আপডেট করা সম্ভব হয়নি।';
  }
  if (message.includes('Failed to delete') || message.includes('deleting')) {
    return 'ডিলিট করা সম্ভব হয়নি।';
  }
  if (message.includes('not found')) {
    return 'তথ্যটি খুঁজে পাওয়া যায়নি।';
  }
  if (
    message.includes('Operation failed') ||
    message.includes('Something went wrong')
  ) {
    return 'দুঃখিত, কোনো একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  }

  // Default fallback - clean up raw message if possible or use a safe wrapper
  return message.length < 50
    ? message
    : 'প্রক্রিয়াটি সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।';
};
