import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Post slug is required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch comments and join with the users table to get name and avatar info
    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select(
        '*, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .eq('post_slug', slug)
      .order('created_at', { ascending: true }); // Chronological for threaded view

    if (error) throw error;

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 },
      );
    }

    const { slug, content, parentId } = await request.json();

    if (!slug || !content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Slug and content are required' },
        { status: 400 },
      );
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        post_slug: slug,
        user_id: user.id,
        content: content.trim(),
        ...(parentId ? { parent_id: parentId } : {}),
      })
      .select(
        '*, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 },
    );
  }
}
