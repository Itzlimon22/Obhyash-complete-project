/**
 * Sends questions to the Supabase Edge Function for relational insertion.
 */
export async function addQuestionsInBulk({ 
  questions, 
  userId 
}: { 
  questions: any[], 
  userId: string 
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-upload-questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ questions, userId }),
    }
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to upload');
  
  return {
    success: true,
    count: result.count,
    errors: result.errors || [],
  };
}