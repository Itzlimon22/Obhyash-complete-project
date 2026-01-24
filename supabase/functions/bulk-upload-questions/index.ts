import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Bypasses RLS for Admin
    )

    const rawQuestions = await req.json()

    // Final mapping before DB insertion
    const formatted = rawQuestions.map((q: any) => ({
      ...q,
      options: q.options.map((optText: string, index: number) => ({
        text: optText,
        is_correct: optText === q.answer,
        order: index + 1
      }))
    }))

    const { data, error } = await supabase.rpc('bulk_upload_questions_v2', {
      questions_data: formatted
    })

    if (error) throw error

    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})