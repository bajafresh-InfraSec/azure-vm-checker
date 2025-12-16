# Azure VM Size Checker

Real-time Azure VM availability and pricing checker across all regions.

**🌐 Live at: [www.azsize.com](https://www.azsize.com)**

## 🚀 Features

- ✅ Check VM availability by region
- ✅ Filter by VM series (B, D, E, F)
- ✅ See pricing estimates
- ✅ Fast, responsive UI
- ✅ Free to use (MVP)

## 🛠️ Tech Stack

- **Frontend**: React
- **Backend**: Azure Functions (Node.js)
- **Hosting**: Azure Static Web Apps
- **API**: Azure Compute Management SDK

## 📦 Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure Functions Core Tools (for API)

### Setup

1. **Install dependencies**

```bash
# Install frontend dependencies
npm install

# Install API dependencies
cd api
npm install
cd ..
```

2. **Run locally**

```bash
# Terminal 1: Start the API (Azure Functions)
cd api
npm install -g azure-functions-core-tools@4
func start

# Terminal 2: Start the React app
npm start
```

The app will open at `http://localhost:3000` and the API runs at `http://localhost:7071`

## 🌐 Deployment to Azure

### Option 1: Deploy via Azure Portal (Easiest)

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Static Web App**
3. Connect your GitHub repository
4. Set build configuration:
   - App location: `/`
   - API location: `api`
   - Output location: `build`
5. Azure will automatically build and deploy!

### Option 2: Deploy via Azure CLI

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

## 🎯 Roadmap

### MVP (Current)
- [x] Basic VM availability check
- [x] Region selector
- [x] VM series filter
- [x] Pricing display

### Phase 2 (Coming Soon)
- [ ] Real Azure API integration
- [ ] Historical availability data
- [ ] Price comparison charts
- [ ] Export to CSV
- [ ] Email alerts

### Phase 3 (Monetization)
- [ ] AI-powered recommendations
- [ ] Premium features (freemium model)
- [ ] API access for developers
- [ ] Multi-region comparison

## 💰 Monetization Plan

1. **Free Tier**: Basic availability checking
2. **Pro Tier ($9-29/mo)**: Advanced features, alerts, exports
3. **Enterprise**: API access, custom integrations
4. **Ads**: Google AdSense on free tier

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Contact

Questions? Reach out at your@email.com

---

Built with ❤️ for the Azure community
