# Fix Google OAuth Redirect Issue on Vercel

## Problem
When accessing the app from Vercel and clicking Google OAuth, users are redirected to `localhost:3000` instead of staying on the Vercel domain.

## Solution Steps

### 1. Find Your Vercel App URL
Your app URL should be something like:
- `https://smartpin-tpo.vercel.app` (production)
- Or one of the preview URLs from the deployment list

### 2. Update Supabase Configuration

1. Go to: https://supabase.com/dashboard
2. Select project: `vhtbinssqbzcjmbgkseo`
3. Navigate to: **Settings → Authentication → URL Configuration**
4. Update the following fields:

   **Site URL:**
   ```
   https://smartpin-tpo.vercel.app
   ```

   **Redirect URLs (add all of these):**
   ```
   https://smartpin-tpo.vercel.app
   https://smartpin-tpo.vercel.app/dashboard
   https://smartpin-tpo.vercel.app/auth/callback
   http://localhost:3000
   http://localhost:3000/dashboard
   ```

### 3. Verify Google Cloud Console Settings

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services → Credentials**
3. Edit your OAuth 2.0 Client ID
4. Ensure **Authorized redirect URIs** contains:
   ```
   https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback
   ```

### 4. Test the Fix

1. Clear browser cache/cookies
2. Visit your Vercel app URL
3. Try Google OAuth login
4. Should now redirect back to Vercel instead of localhost

## Important Notes

- The OAuth flow goes: Vercel App → Google → Supabase → Back to Vercel App
- The `Site URL` in Supabase determines where users are redirected after authentication
- Keep localhost URLs for development purposes

## If Still Not Working

1. Check browser Network tab for redirect URLs
2. Verify all URLs are using HTTPS (except localhost)
3. Try incognito/private browsing mode
4. Check Supabase auth logs in the dashboard

## Contact
If issues persist, share the exact error messages or redirect URLs you're seeing.
