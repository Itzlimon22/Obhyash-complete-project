import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. CORS Headers (Allows your dashboard to talk to this function)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 2. Handle Browser Pre-flight Check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 3. Initialize Supabase Client
    // ✅ CORRECT: We ask for the VARIABLE NAME, not the URL itself.
    // Supabase automatically injects these values when you deploy.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Parse the Input Data
    const { questions, userId } = await req.json();

    if (!questions || !Array.isArray(questions)) {
      throw new Error("Invalid input: 'questions' must be an array.");
    }

    // 5. Call the Database Logic (SQL Function)
    const { data, error } = await supabase.rpc('bulk_upload_questions', {
      questions_payload: questions,
      admin_id: userId || null // Handle case where userId might be missing
    });

    if (error) throw error;

    // 6. Return Success
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    // 7. Return Error
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});