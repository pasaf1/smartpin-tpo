const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vhtbinssqbzcjmbgkseo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJpbnNzcWJ6Y2ptYmdrc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTA3ODUsImV4cCI6MjA3MTc2Njc4NX0.SgFx0iGvjzXzcGNYLwj8f3OYoSJJHiWYunwbIlCcj0k'
);

async function checkPinSchema() {
  console.log('=== Pin Schema Check ===');
  const { data: pin, error } = await supabase.from('pins').select('*').limit(1).single();
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Pin fields:', Object.keys(pin));
    console.log('Sample pin:', pin);
  }
}

checkPinSchema().catch(console.error);
