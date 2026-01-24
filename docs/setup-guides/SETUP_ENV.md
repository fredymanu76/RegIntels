# Environment Setup Guide

## 🔧 Setting Up Supabase Credentials (PERMANENT)

Follow these steps to permanently connect your app to Supabase:

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on your project
3. Go to **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2: Update the .env File

1. Open the `.env` file in the root of your project
2. Replace the placeholder values with your actual credentials:

```env
REACT_APP_SUPABASE_URL=https://your-actual-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

3. Save the file

### Step 3: Restart the Development Server

**IMPORTANT:** You MUST restart the server for environment variables to load:

1. Stop the current server (Ctrl+C in terminal)
2. Restart: `npm start`
3. The app will now permanently use Supabase!

### ✅ Verification

After restarting, you should see in the browser console:
```
✅ Supabase loaded from environment variables
```

The orange "Using Mock Data" banner should disappear, confirming real Supabase connection.

---

## 🔒 Security Notes

- The `.env` file is already added to `.gitignore` - it won't be committed to Git
- Never share your `REACT_APP_SUPABASE_ANON_KEY` publicly
- For production deployment, set these as environment variables in your hosting platform:
  - Vercel: Project Settings → Environment Variables
  - Netlify: Site Settings → Build & Deploy → Environment
  - AWS/Azure: Use their secrets management

---

## 🚨 Troubleshooting

**Problem:** Still seeing "Using Mock Data" after restart

**Solution:**
1. Check `.env` file is in the project root (same folder as `package.json`)
2. Make sure there are no spaces around the `=` sign
3. Restart the dev server completely (kill terminal and restart)
4. Clear browser cache and localStorage

**Problem:** "Database error saving new user"

**Solution:**
1. Make sure you ran the database setup SQL (see QUICK_START.md)
2. Run this SQL to add missing column:
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
```

---

## 📝 Quick Reference

- `.env` - Your actual credentials (DO NOT COMMIT)
- `.env.example` - Template file (safe to commit)
- App checks environment variables FIRST before localStorage
- Environment variables = permanent connection (no more reconnecting!)
