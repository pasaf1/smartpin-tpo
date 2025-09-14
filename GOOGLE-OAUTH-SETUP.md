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
- **Google Cloud Console**: Add correct redirect URIs
- **Supabase Dashboard**: Enable Google OAuth with credentials

## Required Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API:
   - Go to APIs & Services > Library
   - Search for "Google+ API" 
   - Click and enable it

4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     **Production:**
     ```
     https://smartpin-tpo.vercel.app/auth/callback
     ```
     **Development:**
     ```
     http://localhost:3000/auth/callback
     http://127.0.0.1:3000/auth/callback
     ```
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

### 3. Testing

After configuration:
1. Users should be able to click "Continue with Google" 
2. They will be redirected to Google's sign-in page
3. After authentication, they'll return to the SmartPin TPO dashboard

## Troubleshooting

**Error: "Unsupported provider: provider is not enabled"**
- Solution: Follow steps 1-2 above to enable Google OAuth

**Error: "redirect_uri_mismatch"**
- Solution: Ensure the redirect URI in Google Cloud Console exactly matches:
  - Production: `https://smartpin-tpo.vercel.app/auth/callback`
  - Development: `http://localhost:3000/auth/callback`

**Users can't sign in after Google OAuth**
- Solution: Make sure user profiles are created in the `users` table with appropriate roles

## Alternative: Disable Google OAuth Button

If you don't want to set up Google OAuth, you can temporarily hide the button by modifying the login page.

## Files Modified/Created in This Fix

### ✅ New Files Created:
- `/src/app/auth/callback/route.ts` - **CRITICAL**: OAuth callback handler (was missing)
- `/src/app/auth/auth-code-error/page.tsx` - Error page for failed OAuth attempts

### ✅ Files Modified:
- `/src/app/api/debug-oauth/route.ts` - Fixed redirect URL to use app domain instead of Supabase
- `/src/app/api/oauth-check/route.ts` - Added dynamic URL detection for dev/prod
- `/src/lib/auth/AuthContext.tsx` - Updated to use correct callback URL `/auth/callback`
- `/.env.vercel` - Fixed environment variables for production deployment
- `/GOOGLE-OAUTH-SETUP.md` - Updated this comprehensive guide

### Environment Variables Fixed:
```bash
# Production Settings (.env.vercel)
NODE_ENV=production                                    # Was: development
NEXT_PUBLIC_API_BASE_URL=https://smartpin-tpo.vercel.app  # Was: localhost
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Next Steps for Full Setup

1. **Google Cloud Console** - Add the redirect URIs listed above
2. **Supabase Dashboard** - Enable Google provider with credentials
3. **Test** - Use `/api/debug-oauth` to verify configuration
4. **Deploy** - Push changes to Vercel for production testing

## Contact

For technical support with OAuth setup, contact the development team.
