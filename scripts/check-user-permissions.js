// Quick script to check user role and permissions
// Run this in browser console on the dashboard page

console.log('=== SmartPin TPO User Permission Check ===');

// Check if user is logged in
const userEmail = document.querySelector('[data-user-email]')?.textContent;
console.log('Current user:', userEmail || 'Not logged in');

// Check auth context
if (window.React) {
  console.log('React detected - checking auth context...');
}

// Check local storage for session
const supabaseSession = localStorage.getItem('sb-vhtbinssqbzcjmbgkseo-auth-token');
if (supabaseSession) {
  try {
    const session = JSON.parse(supabaseSession);
    console.log('Session found:', {
      user: session.user?.email,
      role: session.user?.user_metadata?.role || 'Unknown'
    });
  } catch (e) {
    console.log('Session exists but could not parse');
  }
} else {
  console.log('No session found in localStorage');
}

// Check if project creation button is enabled
const createButton = document.querySelector('button:has-text("New Project")') || 
                   Array.from(document.querySelectorAll('button')).find(btn => 
                     btn.textContent.includes('New Project'));

if (createButton) {
  console.log('Project creation button found:', {
    disabled: createButton.disabled,
    text: createButton.textContent,
    classes: createButton.className
  });
} else {
  console.log('Project creation button not found');
}

console.log('=== End Permission Check ===');
