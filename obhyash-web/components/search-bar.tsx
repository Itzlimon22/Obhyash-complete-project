// 1. Import the library
import { createClient } from '@supabase/supabase-js';

// 2. Initialize the client (OUTSIDE your component function)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const handleSearch = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select()
    .textSearch('search_vector', searchTerm); // 👈 Uses the index we just made
    
  if (error) {
    console.error("Error searching questions:", error);
    return;
  }
  if (data) console.log("Found questions:", data);
};