# Custom Domain Setup Guide - azsize.com

**Domains Purchased:** azsize.com + azvmsize.com (Namecheap)
**Goal:** Point both domains to Azure Static Web App
**Strategy:** azsize.com = primary, azvmsize.com redirects to azsize.com

---

## Part 1: Azure Portal Setup

### Step 1: Find Your Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Static Web Apps"** (search if needed)
3. Find your app (likely named something like "azure-vm-checker" or similar)
4. Click on it

### Step 2: Get Your Default Azure URL

In your Static Web App overview, you'll see:
```
URL: https://YOURAPP.azurestaticapps.net
```

**Copy this URL** - you'll need it to verify everything works before adding custom domain.

---

## Part 2: Add Custom Domain in Azure

### Step 3: Add azsize.com (Primary Domain)

1. In your Static Web App, click **"Custom domains"** (left sidebar)
2. Click **"+ Add"** button
3. Select **"Custom domain on other DNS"**
4. Enter domain: `azsize.com`
5. Click **"Next"**

### Step 4: Get DNS Records from Azure

Azure will show you DNS records to add:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Host: @
Value: YOURAPP.azurestaticapps.net
TTL: 3600
```

**Option B: A Record + TXT (If CNAME @ doesn't work)**
```
Type: A
Host: @
Value: [IP address Azure provides]
TTL: 3600

AND

Type: TXT
Host: @
Value: [verification code Azure provides]
TTL: 3600
```

**IMPORTANT:** Don't close this Azure page yet! Keep it open while you configure Namecheap.

---

## Part 3: Configure Namecheap DNS

### Step 5: Log into Namecheap

1. Go to [Namecheap.com](https://namecheap.com)
2. Sign in
3. Click **"Domain List"**
4. Find **azsize.com** → Click **"Manage"**

### Step 6: Add DNS Records for azsize.com

1. Scroll to **"Advanced DNS"** tab
2. Click **"Add New Record"**

**Add these records:**

#### Record 1: CNAME for root domain
```
Type: CNAME Record
Host: @
Value: YOURAPP.azurestaticapps.net
TTL: Automatic (or 3600)
```

#### Record 2: CNAME for www
```
Type: CNAME Record
Host: www
Value: YOURAPP.azurestaticapps.net
TTL: Automatic
```

**Note:** If Namecheap doesn't allow CNAME for @, use A record instead (Azure will show you the IP).

### Step 7: Save Changes

1. Click **"Save All Changes"** (green button)
2. Wait 2-5 minutes for DNS propagation

---

## Part 4: Verify Domain in Azure

### Step 8: Complete Azure Custom Domain Setup

1. Go back to Azure Portal (the page you left open)
2. Click **"Add"** or **"Validate"**
3. Azure will check DNS records (may take 1-2 minutes)
4. If successful: ✅ "Custom domain added successfully"
5. If failed: Double-check DNS records match exactly

### Step 9: Enable HTTPS (SSL Certificate)

1. Once domain is added, Azure will automatically provision SSL certificate
2. This takes 5-15 minutes
3. Status will change from "Validating" → "Enabled"

**Wait for this to complete before testing!**

---

## Part 5: Add Second Domain (azvmsize.com)

### Step 10: Add azvmsize.com in Azure

1. In Azure Static Web App → **"Custom domains"**
2. Click **"+ Add"** again
3. Enter: `azvmsize.com`
4. Get DNS records (same process as azsize.com)

### Step 11: Configure Namecheap for azvmsize.com

1. In Namecheap → **"Domain List"** → **azvmsize.com** → **"Manage"**
2. Go to **"Advanced DNS"**
3. Add same CNAME records:
   ```
   Type: CNAME
   Host: @
   Value: YOURAPP.azurestaticapps.net

   Type: CNAME
   Host: www
   Value: YOURAPP.azurestaticapps.net
   ```
4. Save changes

### Step 12: Verify Second Domain

1. Back in Azure Portal
2. Click **"Add"** or **"Validate"**
3. Wait for SSL certificate (5-15 minutes)

---

## Part 6: Set Up Redirect (azvmsize.com → azsize.com)

### Step 13: Configure Azure Redirect

Azure Static Web Apps doesn't have built-in redirects between domains, so we'll handle this in your app.

**Add to `staticwebapp.config.json`:**

```json
{
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff"
  }
}
```

**To redirect azvmsize.com → azsize.com, add JavaScript to your app:**

In `public/index.html`, add this in `<head>`:

```html
<script>
  // Redirect azvmsize.com to azsize.com
  if (window.location.hostname === 'azvmsize.com' ||
      window.location.hostname === 'www.azvmsize.com') {
    window.location.replace('https://azsize.com' + window.location.pathname);
  }
</script>
```

**Then commit and push:**
```bash
git add public/index.html staticwebapp.config.json
git commit -m "Add domain redirect from azvmsize.com to azsize.com"
git push
```

Azure will auto-deploy (2-3 minutes).

---

## Part 7: Testing

### Step 14: Test Your Domains

**Wait 10-15 minutes after DNS changes**, then test:

1. **Test azsize.com:**
   - Open browser: https://azsize.com
   - Should show your site with valid SSL (🔒)

2. **Test www.azsize.com:**
   - Open: https://www.azsize.com
   - Should also work

3. **Test azvmsize.com:**
   - Open: https://azvmsize.com
   - Should redirect to https://azsize.com

4. **Test www.azvmsize.com:**
   - Open: https://www.azvmsize.com
   - Should redirect to https://azsize.com

### Step 15: Check DNS Propagation

Use online tool: [whatsmydns.net](https://www.whatsmydns.net)

1. Enter: azsize.com
2. Select: CNAME
3. Should show: YOURAPP.azurestaticapps.net

**If not showing yet:** Wait 15-30 more minutes (DNS can take time)

---

## Troubleshooting

### Problem: "DNS records not found"
**Solution:**
- Wait 15-30 minutes (DNS propagation)
- Check Namecheap records are saved
- Verify you're editing the correct domain

### Problem: "SSL certificate pending"
**Solution:**
- Wait 10-15 minutes
- Azure auto-provisions Let's Encrypt certificate
- If >1 hour, contact Azure support

### Problem: "CNAME not allowed for @"
**Solution:**
- Use A record instead
- Azure will show you the IP address
- Add both A record and TXT verification record

### Problem: "Site not loading"
**Solution:**
- Check Azure Static Web App is running
- Visit default URL (https://YOURAPP.azurestaticapps.net) first
- Check deployment succeeded (GitHub Actions)

### Problem: "Redirect not working"
**Solution:**
- Check JavaScript was committed
- Clear browser cache (Ctrl+Shift+R)
- Wait for Azure deployment (2-3 minutes after push)

---

## Quick Reference

### Namecheap DNS Records (Final State)

**For azsize.com:**
```
Type: CNAME | Host: @   | Value: YOURAPP.azurestaticapps.net
Type: CNAME | Host: www | Value: YOURAPP.azurestaticapps.net
```

**For azvmsize.com:**
```
Type: CNAME | Host: @   | Value: YOURAPP.azurestaticapps.net
Type: CNAME | Host: www | Value: YOURAPP.azurestaticapps.net
```

### Azure Custom Domains (Final State)

```
✅ azsize.com (Primary)
✅ www.azsize.com (Alias)
✅ azvmsize.com (Redirects to azsize.com)
✅ www.azvmsize.com (Redirects to azsize.com)
```

---

## Timeline

- **DNS changes:** 5-10 minutes to add in Namecheap
- **DNS propagation:** 15-60 minutes (sometimes up to 24 hours)
- **SSL certificate:** 10-15 minutes after DNS validates
- **Total time:** 30 minutes to 2 hours

---

## Next Steps After Domains Work

Once both domains are live:

1. ✅ Update README.md with new domain
2. ✅ Update GitHub repo description
3. ✅ Add Google Analytics
4. ✅ Test all functionality on new domain
5. ✅ Share on LinkedIn: "Just launched azsize.com!"

---

## Common Azure Portal Navigation

If you can't find your Static Web App:

1. Azure Portal → Search "Static Web Apps" in top bar
2. OR: Home → All Resources → Filter by "Static Web App"
3. OR: Home → Resource Groups → [Your RG] → Find Static Web App

---

## Video Walkthrough (If You Get Stuck)

Microsoft has official docs:
- [Add custom domain to Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)

---

**Ready to start? Let's do this!** 🚀

1. Open Azure Portal
2. Find your Static Web App
3. Follow steps above
4. Report back when you hit Step 4 (I can help troubleshoot if needed!)
