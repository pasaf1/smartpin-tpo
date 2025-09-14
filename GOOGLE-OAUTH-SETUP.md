# Google OAuth Setup Guide for SmartPin TPO

This guide explains how to configure Google OAuth for the SmartPin TPO application.

## Current Status
🔧 **Google OAuth CONFIGURATION FIXED** - Major issues resolved!

### ✅ Fixed Issues:
- **CRITICAL**: Added missing `/auth/callback/route.ts` OAuth callback handler
- **CRITICAL**: Fixed redirect URLs to use correct application URLs instead of Supabase URLs
- **Fixed**: Updated environment variables for proper Vercel deployment
- **Fixed**: Added error handling page for failed OAuth attempts
- **Fixed**: Dynamic URL detection for development vs production

### ⚠️ **REMAINING**: Manual Configuration Required:
- **Google Cloud Console**: Add Supabase OAuth callback URLs (not app URLs)
- **Supabase Dashboard**: Enable Google OAuth provider with your credentials
- **Environment Variables**: Update with your actual Google OAuth credentials

## Required Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable required Google APIs:
   - Go to APIs & Services > Library
   - Search for "Google Identity API" and enable it
   - Search for "Google People API" and enable it (optional, for profile data)
   - Note: Google+ API has been deprecated and is no longer required

4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     **Production:**
     ```
     https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback
     ```
     **Development:**
     ```
     http://127.0.0.1:54321/auth/v1/callback
     ```
     **Note:** These are Supabase OAuth callback URLs, not your application URLs.
     Your app callback route at `/auth/callback` will handle the final redirect.
   - Copy the Client ID and Client Secret

### 2. Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vhtbinssqbzcjmbgkseo`
3. Navigate to: Authentication > Providers
4. Find "Google" in the list
5. Enable the Google provider
6. Add your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
7. Save the configuration

### 3. OAuth Flow Process

The complete OAuth flow works as follows:
1. User clicks "Continue with Google" in your app
2. User is redirected to Google's sign-in page
3. After authentication, Google redirects to Supabase OAuth callback:
   - Production: `https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback`
   - Development: `http://127.0.0.1:54321/auth/v1/callback`
4. Supabase processes the OAuth response and redirects to your app's callback:
   - Your app callback: `/auth/callback/route.ts`
5. Your callback handler exchanges the code for a session and redirects to dashboard

### 4. Testing

After configuration:
1. Start your development server: `pnpm dev`
2. Visit the login page and click "Continue with Google"
3. Complete Google authentication
4. Verify you're redirected back to your application dashboard
5. Check browser developer tools for any console errors

## Troubleshooting

### Common OAuth Errors

**1. Error: "Unsupported provider: provider is not enabled"**
- **Cause**: Google OAuth is not enabled in Supabase
- **Solution**: Go to Supabase Dashboard > Authentication > Providers and enable Google

**2. Error: "redirect_uri_mismatch"**
- **Cause**: Redirect URI in Google Cloud Console doesn't match Supabase callback URL
- **Solution**: Ensure exact match in Google Cloud Console:
  - Production: `https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback`
  - Development: `http://127.0.0.1:54321/auth/v1/callback`
- **Note**: Do NOT use your app URLs (`smartpin-tpo.vercel.app` or `localhost:3000`)

**3. Error: "Invalid client_id"**
- **Cause**: Missing or incorrect Google OAuth credentials
- **Solution**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment variables

**4. Users can't access app after successful Google OAuth**
- **Cause**: User profile not created or missing permissions
- **Solution**: Check that users are properly created in your database with correct roles

**5. OAuth works in development but fails in production**
- **Cause**: Different environment configurations
- **Solution**:
  - Verify `.env.vercel` has correct production credentials
  - Ensure Google Cloud Console has production callback URL
  - Check Supabase project settings match production environment

### Debugging Tools

Use these endpoints to debug OAuth configuration:
- `/api/debug-oauth` - Shows current OAuth configuration
- `/api/oauth-check` - Validates environment setup
- Browser Developer Tools > Network tab - Monitor OAuth flow requests

## Alternative: Disable Google OAuth

If you don't want to set up Google OAuth immediately:
1. Comment out or remove the Google OAuth button from your login components
2. Users can still create accounts using email/password authentication
3. You can enable Google OAuth later by following this guide

## Files Modified/Created in This Fix

### ✅ New Files Created:
- `/src/app/auth/callback/route.ts` - **CRITICAL**: OAuth callback handler (was missing)
- `/src/app/auth/auth-code-error/page.tsx` - Error page for failed OAuth attempts

### ✅ Files Modified:
- `/src/app/api/debug-oauth/route.ts` - OAuth debugging utility
- `/src/app/api/oauth-check/route.ts` - OAuth configuration checker
- `/src/app/auth/callback/route.ts` - OAuth callback handler for your application
- `/.env.local` - Development environment configuration
- `/.env.vercel` - Production environment configuration
- `/GOOGLE-OAUTH-SETUP.md` - This comprehensive setup guide

### Environment Variables Configuration:

**Production (.env.vercel):**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vhtbinssqbzcjmbgkseo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJpbnNzcWJ6Y2ptYmdrc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTA3ODUsImV4cCI6MjA3MTc2Njc4NX0.SgFx0iGvjzXzcGNYLwj8f3OYoSJJHiWYunwbIlCcj0k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJpbnNzcWJ6Y2ptYmdrc2VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE5MDc4NSwiZXhwIjoyMDcxNzY2Nzg1fQ.owig5fa2XYaC5exBaH_IVpnuYaub-Tu3UxheFtPI4WM

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://smartpin-tpo.vercel.app

# Google OAuth Credentials (replace with your actual values)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Development (.env.local):**
```bash
# Supabase Configuration (same as production)
NEXT_PUBLIC_SUPABASE_URL=https://vhtbinssqbzcjmbgkseo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJpbnNzcWJ6Y2ptYmdrc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTA3ODUsImV4cCI6MjA3MTc2Njc4NX0.SgFx0iGvjzXzcGNYLwj8f3OYoSJJHiWYunwbIlCcj0k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodGJpbnNzcWJ6Y2ptYmdrc2VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE5MDc4NSwiZXhwIjoyMDcxNzY2Nzg1fQ.owig5fa2XYaC5exBaH_IVpnuYaub-Tu3UxheFtPI4WM

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Google OAuth Credentials (Replace with your actual credentials)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Next Steps for Full Setup

1. **Google Cloud Console Configuration:**
   - Create OAuth 2.0 Client ID with redirect URIs:
     - Production: `https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback`
     - Development: `http://127.0.0.1:54321/auth/v1/callback`
   - Copy Client ID and Client Secret

2. **Supabase Dashboard Configuration:**
   - Go to Authentication > Providers in your Supabase project
   - Enable Google OAuth with your credentials
   - The site URL should be set to your app domain

3. **Environment Variables:**
   - Update `.env.local` with your Google OAuth credentials
   - Ensure `.env.vercel` has the same credentials for production

4. **Testing and Debugging:**
   - Use `/api/debug-oauth` endpoint to verify configuration
   - Use `/api/oauth-check` to validate environment setup
   - Test login flow in both development and production

5. **Deployment:**
   - Push changes to Vercel
   - Verify production OAuth flow works correctly

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/) - Create and manage OAuth credentials
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth) - Official Supabase auth guide
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login) - Social login setup
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication) - Next.js auth patterns

## Support

For technical support with OAuth setup:
1. Check the troubleshooting section above
2. Use the debugging endpoints (`/api/debug-oauth`, `/api/oauth-check`)
3. Review browser console and network logs
4. Contact the development team with specific error messages
