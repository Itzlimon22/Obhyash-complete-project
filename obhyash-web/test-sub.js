const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient('https://example.supabase.co', 'public-anon-key');
  const channel = supabase.channel('test');
  
  const result = channel.subscribe((status) => {
    console.log(status);
  });
  
  console.log("Result is:", result.constructor.name);
  console.log("Is Promise?", result instanceof Promise);
}
test();
