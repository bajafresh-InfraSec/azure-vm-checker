# 🚀 Deployment Instructions - CRITICAL STEPS

**Status:** Code pushed to GitHub ✅
**Azure Deployment:** In progress (2-3 minutes)
**Environment Variables:** ❌ NOT SET YET - REQUIRED!

---

## ⚠️ CRITICAL: Add Environment Variables to Azure

Azure Static Web Apps needs the Supabase credentials to work. Without these, the authentication won't function.

### **Step 1: Go to Azure Portal**

1. Open: https://portal.azure.com
2. Navigate to your Static Web App: **azure-vm-checker-rg**
3. Click **"Configuration"** in the left sidebar

### **Step 2: Add Application Settings**

Click **"+ Add"** and add these **3 environment variables**:

#### **Variable 1:**
```
Name: REACT_APP_SUPABASE_URL
Value: https://epnrjmqjiqjndgbqaemx.supabase.co
```

#### **Variable 2:**
```
Name: REACT_APP_SUPABASE_ANON_KEY
Value: sb_publishable_1R5I393AiMKDIIFIQj5OzA_Do1s3RoS
```

#### **Variable 3:**
```
Name: REACT_APP_API_URL
Value: https://www.azsize.com
```

### **Step 3: Save**

1. Click **"Save"** at the top
2. Click **"Continue"** to confirm restart
3. Wait 30-60 seconds for the app to restart

---

## ✅ Verify Deployment

After adding environment variables:

1. Wait 2-3 minutes for Azure deployment to finish
2. Go to: https://www.azsize.com
3. Try to check a VM → Should work! ✅
4. Try to check again → **Signup modal should appear!** 🎉

---

## 🔧 Configure Supabase (Required for Signup/Login)

### **Step 1: Set Site URL in Supabase**

1. Go to: https://supabase.com
2. Open your project: **azsize-auth**
3. Click **Authentication** → **URL Configuration** tab
4. Set **Site URL** to: `https://www.azsize.com`
5. Add **Redirect URLs**:
   - `https://www.azsize.com`
   - `https://www.azsize.com/login`
   - `https://www.azsize.com/dashboard`
   - `http://localhost:3000` (for local testing)
6. Click **Save**

### **Step 2: Test Email Verification**

1. Go to: https://www.azsize.com
2. Check 1 VM (works)
3. Try 2nd check → Modal appears
4. Click "Create Free Account"
5. Sign up with your email
6. **Check your email inbox** (may take 1-2 minutes)
7. Click verification link
8. Login at https://www.azsize.com/login
9. You should see the dashboard! ✅

---

## 📊 What's Working Now

### **Frontend (100% Complete)**
- ✅ Anonymous rate limiting (1 free check)
- ✅ Signup modal after 1st check
- ✅ User signup with email verification
- ✅ User login
- ✅ Dashboard (shows placeholder data)
- ✅ Beautiful auth UI

### **Backend (Pending)**
- ⏳ API authentication middleware
- ⏳ Rate limiting enforcement (50/month)
- ⏳ API key generation
- ⏳ Usage tracking in Supabase

**Current behavior:**
- Anonymous users: 1 check (enforced by frontend localStorage)
- Authenticated users: Unlimited checks (until backend is implemented)

---

## 🎯 Test Checklist

After deployment + environment variables are set:

- [ ] Go to www.azsize.com
- [ ] Check 1 VM → Works
- [ ] Try 2nd check → Signup modal appears
- [ ] Click "Create Free Account" → Goes to /signup
- [ ] Fill out signup form → Success message
- [ ] Check email → Verification email received
- [ ] Click verification link → Account verified
- [ ] Go to /login → Enter credentials
- [ ] Login successful → Redirected to /dashboard
- [ ] Dashboard shows your email
- [ ] Logout works
- [ ] Go back to homepage → Can check VMs (unlimited for now)

---

## 🐛 Troubleshooting

### **Issue: "Failed to fetch VM availability"**
- **Cause:** Environment variable `REACT_APP_API_URL` not set in Azure
- **Fix:** Add the environment variable and restart the app

### **Issue: Signup page blank or errors**
- **Cause:** Supabase environment variables not set
- **Fix:** Add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

### **Issue: Email verification link doesn't work**
- **Cause:** Site URL not configured in Supabase
- **Fix:** Set Site URL to `https://www.azsize.com` in Supabase

### **Issue: Can't login after verifying email**
- **Cause:** Redirect URLs not configured
- **Fix:** Add redirect URLs in Supabase URL Configuration

### **Issue: Modal doesn't appear after 1st check**
- **Cause:** Browser localStorage blocked
- **Fix:** Try in incognito mode or clear localStorage

---

## 📈 Next Steps

### **Phase 1: Test & Monitor (Today)**
1. ✅ Add environment variables to Azure
2. ✅ Configure Supabase URLs
3. ✅ Test full signup/login flow
4. ✅ Monitor for any errors

### **Phase 2: Backend Authentication (1-2 days)**
1. Install Supabase in Azure Functions
2. Create auth middleware
3. Update GetVMAvailability endpoint
4. Create GenerateAPIKey endpoint
5. Add usage logging to Supabase
6. Test rate limiting (50/month)

### **Phase 3: CLI Updates (1 day)**
1. Add `azsize auth login` command
2. Add `azsize auth status` command
3. Store API key in config file
4. Update all commands to send API key
5. Handle 429 rate limit errors

---

## 🎉 Success!

Once you've added the environment variables and configured Supabase:

**Your website will have:**
- ✅ Beautiful authentication system
- ✅ Anonymous users get 1 free check
- ✅ Signup flow with email verification
- ✅ User dashboard
- ✅ Professional UI/UX

**Revenue impact:**
- Users must signup after 1 free check
- Builds email list for marketing
- Prepares for Pro tier ($9/mo unlimited)
- Foundation for API access monetization

---

**Deployment Status:** Code pushed at $(date)
**Next Action:** Add environment variables to Azure Portal NOW!

