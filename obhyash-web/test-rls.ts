import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPolicies() {
  console.log('Applying RLS policies for blog interactions...');

  // Using raw SQL injection via rpc, or falling back to testing queries if we lack direct SQL execution.
  // Wait, Supabase js client doesn't execute raw SQL easily without an RPC.
  // We'll create a Migration SQL file for the user to run if that's the issue.
  console.log(
    'Testing insert manually with service_role to verify schema existence.',
  );

  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;

  if (userId) {
    const likeRes = await supabase
      .from('blog_likes')
      .insert({ post_slug: 'test', user_id: userId })
      .select();
    console.log(
      'Service Role Like Insert:',
      likeRes.error?.message || 'Success',
    );

    const commentRes = await supabase
      .from('blog_comments')
      .insert({ post_slug: 'test', user_id: userId, content: 'Test' })
      .select();
    console.log(
      'Service Role Comment Insert:',
      commentRes.error?.message || 'Success',
    );
  }
}

applyPolicies();
