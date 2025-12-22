# Google Search Console Setup Guide

## Step 1: Access Google Search Console

1. Go to https://search.google.com/search-console
2. Sign in with your Google account

## Step 2: Add Property

1. Click **"Add Property"**
2. Choose **"Domain"** property type (recommended)
   - Enter: `azsize.com`
   - This will cover www.azsize.com, azsize.com, and all subdomains

## Step 3: Verify Ownership (DNS Method - Recommended)

### Option A: DNS TXT Record (Works for both www and non-www)

1. Google will provide a TXT record like: `google-site-verification=abc123xyz...`
2. Go to Namecheap:
   - Log in to your Namecheap account
   - Go to Domain List → Manage → Advanced DNS
   - Add a new record:
     - **Type:** TXT Record
     - **Host:** @
     - **Value:** `google-site-verification=abc123xyz...` (from Google)
     - **TTL:** Automatic
3. Click "Save All Changes"
4. Wait 5-10 minutes for DNS propagation
5. Return to Google Search Console and click "Verify"

### Option B: HTML File Upload (Alternative)

1. Google will provide an HTML file to download
2. Upload this file to your Azure Static Web App:
   - Add it to `/public/` directory in your repo
   - Commit and push
   - Wait for deployment to complete
3. Verify the file is accessible at: `https://www.azsize.com/google-site-verification-file.html`
4. Return to Google Search Console and click "Verify"

## Step 4: Submit Your Sitemap

Once verified:

1. In Google Search Console, go to **Sitemaps** (left sidebar)
2. Enter sitemap URL: `https://www.azsize.com/sitemap.xml`
3. Click **Submit**

Google will now:
- Discover all URLs in your sitemap
- Crawl your pages
- Index them in search results
- Show you search performance data

## Step 5: Monitor Your Site

After 24-48 hours, check:
- **Coverage** - See which pages are indexed
- **Performance** - Track clicks, impressions, CTR
- **Enhancements** - Check for any issues

## What Gets Indexed?

Based on your sitemap.xml:
- Homepage (/)
- Privacy page (/privacy.html)
- Blog index (/blog)
- Blog posts:
  - /blog/azure-vm-availability-guide
  - /blog/azsize-cli-guide

Login, signup, and dashboard pages won't be indexed (not in sitemap).

## Expected Timeline

- **Verification:** Immediate (after DNS propagates)
- **Sitemap submission:** Immediate
- **First crawl:** 24-48 hours
- **First impressions:** 3-7 days
- **Ranking improvements:** 2-4 weeks

## Troubleshooting

### DNS Verification Failing
- Wait longer (DNS can take up to 48 hours)
- Check TXT record with: `nslookup -type=TXT azsize.com`
- Make sure Host is `@` not `www`

### HTML File Not Found
- Ensure file is in `/public/` folder
- Check deployment completed successfully
- Try accessing the URL directly in your browser

### Sitemap Not Processing
- Verify sitemap is valid XML (check in browser)
- Ensure all URLs are absolute (https://www.azsize.com/...)
- Wait 24 hours and check again

## Next Steps After Setup

1. Request indexing for key pages manually
2. Monitor search query performance
3. Fix any coverage issues reported
4. Add more blog content regularly
5. Build backlinks by sharing on Reddit, Twitter, etc.
