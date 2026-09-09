/**
 * Generates a random DiceBear avatar URL based on gender and a seed.
 * @param gender The user's gender ('Male', 'Female', or other)
 * @param seed A unique seed (usually the user's ID or email)
 * @returns A DiceBear avatar URL
 */
export const getRandomAvatar = (
  gender: string | null,
  seed: string,
): string => {
  const cleanGender = (gender || 'Other').toLowerCase();

  // Use different styles based on gender for variety
  // Adventurer for males, Lorelei for females, Fun-emoji for others
  let style = 'adventurer';

  if (cleanGender === 'male') {
    style = 'adventurer';
  } else if (cleanGender === 'female') {
    style = 'lorelei';
  } else {
    // For unspecified/other, pick deterministically based on seed so user gets a consistent student avatar
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    style = Math.abs(hash) % 2 === 0 ? 'adventurer' : 'lorelei';
  }

  // Add scale and radius parameters to make the avatar fit the circle better
  // scale 120 makes it larger, backgroundColor transparent ensures no background box
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed.length > 0 ? seed : 'default')}&scale=120&radius=0&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};
