# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for the SmartPin TPO application.

## Current Status
❌ **Google OAuth is NOT configured** - Users will see error: "Unsupported provider: provider is not enabled"

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
     ```
     https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback
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
  `https://vhtbinssqbzcjmbgkseo.supabase.co/auth/v1/callback`

**Users can't sign in after Google OAuth**
- Solution: Make sure user profiles are created in the `users` table with appropriate roles

## Alternative: Disable Google OAuth Button

If you don't want to set up Google OAuth, you can temporarily hide the button by modifying the login page.

## Contact

For technical support with OAuth setup, contact the development team.
