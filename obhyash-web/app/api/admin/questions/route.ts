import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { generateQuestionFingerprint } from '@/lib/crypto-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function mapQuestionToCamelCase(q: Record<string, any>) {
  return {
    ...q,
    createdAt: q.created_at || new Date().toISOString(),
    updatedAt: q.updated_at || new Date().toISOString(),
    correctAnswer: q.correct_answer,
    correctAnswerIndex: q.correct_answer_index,
    correctAnswerIndices: q.correct_answer_indices || [],
    subjectId: q.subject_id,
    chapterId: q.chapter_id,
    topicId: q.topic_id,
    imageUrl: q.image_url,
    optionImages: q.option_images || [],
    explanationImageUrl: q.explanation_image_url,
    examType: q.exam_type,
    authorName: q.author_name,
    institutes: q.institutes || [],
    years: q.years || [],
    tags: q.tags || [],
  };
}

function mapQuestionToSnakeCase(q: Record<string, any>) {
  const dbRecord: Record<string, any> = { ...q };

  if ('createdAt' in q) {
    dbRecord.created_at = q.createdAt;
    delete dbRecord.createdAt;
  }
  if ('updatedAt' in q) {
    dbRecord.updated_at = q.updatedAt;
    delete dbRecord.updatedAt;
  }
  if ('correctAnswer' in q) {
    dbRecord.correct_answer = q.correctAnswer;
    delete dbRecord.correctAnswer;
  }
  if ('correctAnswerIndex' in q) {
    dbRecord.correct_answer_index = q.correctAnswerIndex;
    delete dbRecord.correctAnswerIndex;
  }
  if ('correctAnswerIndices' in q) {
    dbRecord.correct_answer_indices = q.correctAnswerIndices;
    delete dbRecord.correctAnswerIndices;
  }
  if ('subjectId' in q) {
    dbRecord.subject_id = q.subjectId;
    delete dbRecord.subjectId;
  }
  if ('chapterId' in q) {
    dbRecord.chapter_id = q.chapterId;
    delete dbRecord.chapterId;
  }
  if ('topicId' in q) {
    dbRecord.topic_id = q.topicId;
    delete dbRecord.topicId;
  }
  if ('imageUrl' in q) {
    dbRecord.image_url = q.imageUrl;
    delete dbRecord.imageUrl;
  }
  if ('optionImages' in q) {
    dbRecord.option_images = q.optionImages;
    delete dbRecord.optionImages;
  }
  if ('explanationImageUrl' in q) {
    dbRecord.explanation_image_url = q.explanationImageUrl;
    delete dbRecord.explanationImageUrl;
  }
  if ('examType' in q) {
    dbRecord.exam_type = q.examType;
    delete dbRecord.examType;
  }
  if ('authorName' in q) {
    dbRecord.author_name = q.authorName;
    delete dbRecord.authorName;
  }

  return dbRecord;
}

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');
    const author = searchParams.get('author');
    const search = searchParams.get('search');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Build base query
    let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });

    if (subject) query = query.eq('subject', subject);
    if (chapter) query = query.eq('chapter', chapter);
    if (topic) query = query.eq('topic', topic);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (status) {
      if (status === 'Pending') {
        query = query.or('status.eq.Pending,status.is.null');
      } else {
        query = query.eq('status', status);
      }
    }
    if (author) query = query.eq('author', author);

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `question.ilike.%${searchTerm}%,exam_type.ilike.%${searchTerm}%,institute.ilike.%${searchTerm}%`,
      );
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Optimize DB Reads: Only fetch separate status breakdown on page 1
    const shouldFetchBreakdown = page === 1;

    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    let pageRes;
    if (shouldFetchBreakdown) {
      const [pRes, appRes, pendRes, rejRes] = await Promise.all([
        query,
        supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Approved'),
        supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.Pending,status.is.null'),
        supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Rejected'),
      ]);
      pageRes = pRes;
      approvedCount = appRes.count || 0;
      pendingCount = pendRes.count || 0;
      rejectedCount = rejRes.count || 0;
    } else {
      pageRes = await query;
    }

    if (pageRes.error) {
      console.error('Error fetching questions:', pageRes.error);
      throw pageRes.error;
    }

    const totalCount = pageRes.count || 0;
    const mappedQuestions = (pageRes.data || []).map(mapQuestionToCamelCase);

    return NextResponse.json({
      success: true,
      data: {
        questions: mappedQuestions,
        totalCount,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/questions GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch questions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Check if bulk insert
    if (Array.isArray(body)) {
      const records = await Promise.all(
        body.map(async (q) => {
          const mapped = mapQuestionToSnakeCase(q);
          if (!mapped.fingerprint && mapped.question && mapped.options) {
            mapped.fingerprint = await generateQuestionFingerprint({
              question: mapped.question,
              options: mapped.options,
              subject: mapped.subject,
              chapter: mapped.chapter,
            });
          }
          if (!mapped.random_id) {
            mapped.random_id = Math.random();
          }
          return mapped;
        }),
      );

      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert(records)
        .select();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        data: (data || []).map(mapQuestionToCamelCase),
      });
    }

    // Single question insert
    const mapped = mapQuestionToSnakeCase(body);
    if (!mapped.fingerprint && mapped.question && mapped.options) {
      mapped.fingerprint = await generateQuestionFingerprint({
        question: mapped.question,
        options: mapped.options,
        subject: mapped.subject,
        chapter: mapped.chapter,
      });
    }
    if (!mapped.random_id) {
      mapped.random_id = Math.random();
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert([mapped])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapQuestionToCamelCase(data),
    });
  } catch (err: any) {
    console.error('Error in /api/admin/questions POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create question' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const mapped = mapQuestionToSnakeCase(updates);
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapQuestionToCamelCase(data),
    });
  } catch (err: any) {
    console.error('Error in /api/admin/questions PUT:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update question' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (id) {
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .in('id', idList);
      if (error) throw error;
      return NextResponse.json({ success: true, count: idList.length });
    }

    // Check JSON body for { ids: string[] }
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) {
        const { error } = await supabaseAdmin
          .from('questions')
          .delete()
          .in('id', body.ids);
        if (error) throw error;
        return NextResponse.json({ success: true, count: body.ids.length });
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: 'No question ID(s) provided' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/questions DELETE:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete question' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { ids, status, metadata } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question IDs array is required' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }
    if (metadata) {
      const mapped = mapQuestionToSnakeCase(metadata);
      Object.assign(updates, mapped);
    }

    const { error } = await supabaseAdmin
      .from('questions')
      .update(updates)
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: ids.length,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/questions PATCH:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update questions' },
      { status: 500 },
    );
  }
}
