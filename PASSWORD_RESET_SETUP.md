# Password Reset Setup Guide

## Problem
When users clicked the password reset link in their email, they were redirected to Claude Chat instead of the RegIntels app.

## Solution Implemented

### 1. Added Password Reset Functionality to App.js

**Changes made:**
- ✅ Added "Forgot Password" link to login page
- ✅ Created password reset request form (sends email)
- ✅ Created `PasswordResetPage` component for setting new password
- ✅ Added routing logic to detect `/auth/reset-password` URL

### 2. Required Supabase Configuration

You need to configure the redirect URL in your Supabase project:

**Steps:**
1. Go to: https://supabase.com/dashboard/project/cnyvjuxmkpzxnztbbydu
2. Click **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/reset-password
   http://localhost:3000/*
   ```
4. If you have a production URL, also add:
   ```
   https://yourdomain.com/auth/reset-password
   https://yourdomain.com/*
   ```
5. Click **Save**

---

## How It Works

### Password Reset Flow:

1. **User clicks "Forgot password?" on login page**
   - Enters their email
   - System sends password reset email via Supabase

2. **User receives email with reset link**
   - Link format: `http://localhost:3000/auth/reset-password#access_token=...&type=recovery`

3. **User clicks reset link**
   - App detects `/auth/reset-password` route or `type=recovery` in URL
   - Shows `PasswordResetPage` component

4. **User enters new password**
   - Password must be at least 8 characters
   - Confirm password must match
   - System updates password via Supabase

5. **Success**
   - User sees success message
   - Auto-redirected to login page after 3 seconds

---

## Testing the Password Reset Flow

### Step 1: Start the App
```bash
npm start
```

### Step 2: Request Password Reset
1. Go to `http://localhost:3000`
2. Click **"Forgot password?"** link
3. Enter your email address
4. Click **"Send Reset Link"**
5. Check your email inbox

### Step 3: Reset Password
1. Open the password reset email
2. Click the **"Reset Password"** link
3. You should be redirected to `http://localhost:3000/auth/reset-password`
4. Enter your new password (at least 8 characters)
5. Confirm the password
6. Click **"Reset Password"**

### Step 4: Verify
1. After success message, you'll be redirected to login
2. Log in with your new password
3. Should successfully access RegIntels dashboard

---

## Code Changes Summary

### LoginPage Component (lines 405-608)
- Added `showForgotPassword` and `resetEmailSent` states
- Added `handleForgotPassword()` function
- Added conditional rendering for "Forgot Password" form
- Added "Forgot password?" link below password field

### PasswordResetPage Component (lines 611-720)
- New component for handling password reset
- Validates password (minimum 8 characters)
- Confirms passwords match
- Updates password via Supabase
- Shows success message and redirects

### Main App Component (lines 926-930)
- Detects password reset URL
- Routes to `PasswordResetPage` when appropriate

---

## Important Notes

- ✅ Password reset emails are sent by Supabase (not Resend)
- ✅ Reset links expire after a certain time (configured in Supabase)
- ✅ Users must verify their email before they can reset password
- ✅ The redirect URL MUST be added to Supabase allowed URLs
- ✅ Works for both `localhost:3000` (development) and production URLs

---

## Troubleshooting

### Issue: Email not received
- Check spam/junk folder
- Verify email is correct in Supabase auth.users table
- Check Supabase email templates are enabled

### Issue: Still redirecting to wrong URL
- Verify redirect URLs are saved in Supabase dashboard
- Clear browser cache and try again
- Check the email link URL - it should contain your app domain

### Issue: "Invalid token" error on reset page
- Reset links expire after some time
- Request a new reset link
- Ensure you're using the latest link from email

### Issue: Password reset succeeds but can't login
- Wait a few seconds for the change to propagate
- Try clearing browser cache
- Verify new password meets requirements (8+ characters)

---

## Files Modified

- `src/App.js` - Added password reset UI and logic

---

**Status:** ✅ Implementation Complete
**Next Step:** Configure Supabase redirect URLs and test the flow
