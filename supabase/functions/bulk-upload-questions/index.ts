import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const rawData = await req.json() // This is the array from your Admin Dashboard

    for (const q of rawData) {
      // 1. Upsert Subject
      const { data: sub } = await supabase.from('subjects').upsert({ name: q.subject }, { onConflict: 'name' }).select().single()
      
      // 2. Upsert Chapter
      const { data: chap } = await supabase.from('chapters').upsert({ name: q.chapter, subject_id: sub.id }, { onConflict: 'name,subject_id' }).select().single()

      // 3. Insert Question (with optional fields)
      const { data: quest } = await supabase.from('questions').insert({
        chapter_id: chap.id,
        question_text: q.question,
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'Medium',
        exam_type: q.examType || null,
        institute: q.institute || null,
        year: q.year || null
      }).select().single()

      // 4. Insert Options
      const options = [
        { question_id: quest.id, option_text: q.option1, is_correct: q.answer === 'option1', order: 1 },
        { question_id: quest.id, option_text: q.option2, is_correct: q.answer === 'option2', order: 2 },
        { question_id: quest.id, option_text: q.option3, is_correct: q.answer === 'option3', order: 3 },
        { question_id: quest.id, option_text: q.option4, is_correct: q.answer === 'option4', order: 4 },
      ]
      await supabase.from('options').insert(options)
    }

    return new Response(JSON.stringify({ message: "Upload Complete" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
  }
})