import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Fetch all comments or subscribers securely
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'comments' or 'subscribers'

    // Admin Verification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized Access' },
        { status: 401 },
      );
    }

    if (type === 'subscribers') {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (type === 'comments') {
      // Get all comments AND the associated user data
      const { data, error } = await supabase
        .from('blog_comments')
        .select(
          `
          *,
          user:users (
            name,
            email,
            avatar_url
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Error fetching admin blog data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// Delete an offensive comment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Admin Verification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized Access' },
        { status: 401 },
      );
    }

    const { id } = await request.json();
    if (!id)
      return NextResponse.json(
        { error: 'Comment ID required' },
        { status: 400 },
      );

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 },
    );
  }
}
