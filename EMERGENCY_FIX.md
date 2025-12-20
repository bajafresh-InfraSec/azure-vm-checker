# 🚨 EMERGENCY FIX - Site Not Loading

## Problem
The site loads background colors but nothing else = JavaScript error

## Root Cause
Environment variables not set in Azure → Supabase can't initialize → App crashes

## IMMEDIATE FIX - Add Environment Variables

### Option 1: Azure Portal (2 minutes)

1. Go to: https://portal.azure.com
2. Search for "azure-vm-checker"
3. Click your Static Web App
4. Click **"Environment variables"** or **"Configuration"**
5. Click **"+ Add"**
6. Add these 3 variables:

```
REACT_APP_SUPABASE_URL = https://epnrjmqjiqjndgbqaemx.supabase.co
REACT_APP_SUPABASE_ANON_KEY = sb_publishable_1R5I393AiMKDIIFIQj5OzA_Do1s3RoS
REACT_APP_API_URL = https://www.azsize.com
```

7. **Save** and wait 60 seconds

### Option 2: Rollback (if needed)

If adding variables doesn't work immediately, rollback to previous version:

```bash
cd C:\Users\jazzs\projects\azure-vm-checker
git revert HEAD --no-edit
git push
```

This will restore the working version while we debug.

## What to Check in Browser Console

Press F12 → Console tab, look for errors like:
- "Cannot read property 'auth' of undefined" → Supabase not initialized
- "REACT_APP_SUPABASE_URL is not defined" → Env vars missing
- Router errors → React Router issue

## If Variables Don't Fix It

The issue might be React Router v7 compatibility. Quick fix:

1. Rollback the deployment (see Option 2 above)
2. We'll downgrade react-router-dom to v6
3. Redeploy

Let me know what error you see in the console!
