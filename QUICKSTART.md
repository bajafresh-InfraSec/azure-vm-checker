# 🚀 Quick Start Guide

## Get Running in 5 Minutes!

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install API dependencies
cd api
npm install
cd ..
```

### Step 2: Test Locally (Optional)

```bash
# Install Azure Functions Core Tools (if not already installed)
npm install -g azure-functions-core-tools@4

# Start the API (in one terminal)
cd api
func start

# Start React app (in another terminal)
npm start
```

Visit `http://localhost:3000` to see it running!

### Step 3: Deploy to Azure

#### Option A: Via GitHub (Recommended)

1. Create a GitHub account if you don't have one
2. Create a new repository called `azure-vm-checker`
3. Push your code:

```bash
git add .
git commit -m "Initial commit - Azure VM Checker MVP"
git remote add origin https://github.com/YOUR_USERNAME/azure-vm-checker.git
git branch -M main
git push -u origin main
```

4. Go to [Azure Portal](https://portal.azure.com)
5. Search for "Static Web Apps" → Click "Create"
6. Fill in:
   - **Resource Group**: Create new → `azure-vm-checker-rg`
   - **Name**: `azure-vm-checker` (or your domain name)
   - **Plan**: Free (F0)
   - **Region**: Central US (or closest to you)
   - **Source**: GitHub
   - **Organization**: Your GitHub username
   - **Repository**: azure-vm-checker
   - **Branch**: main
   - **Build Presets**: React
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `build`
7. Click "Review + Create" → "Create"
8. Wait 2-3 minutes for deployment
9. Click "Go to resource" → Copy the URL
10. Visit your site! 🎉

#### Option B: Via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name azure-vm-checker-rg --location centralus

# Create static web app
az staticwebapp create \
  --name azure-vm-checker \
  --resource-group azure-vm-checker-rg \
  --source https://github.com/YOUR_USERNAME/azure-vm-checker \
  --location centralus \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "build"
```

### Step 4: Connect Your Domain (After Buying)

1. Buy `azureVMSize.com` from Namecheap
2. In Azure Portal, go to your Static Web App
3. Click "Custom domains" → "Add"
4. Enter your domain: `azureVMSize.com`
5. Azure will give you DNS records to add
6. Go to Namecheap → Domain → Manage → Advanced DNS
7. Add the DNS records Azure provided
8. Wait 10-60 minutes for DNS propagation
9. Your site is live! 🚀

## Next Steps

- [ ] Test the site
- [ ] Add Google Analytics
- [ ] Apply for Google AdSense
- [ ] Share on LinkedIn/Twitter
- [ ] Start building traffic!

## Need Help?

Check the main README.md for detailed documentation.

---

**Estimated total cost:** $12/year (just the domain!)
**Time to launch:** 1-2 hours
**Potential revenue:** $500-5000/month (with traffic and monetization)

Let's make that money! 💰
