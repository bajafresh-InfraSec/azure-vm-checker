# azsize.com - Azure VM Size & Availability Checker

Real-time Azure VM availability and pricing checker across all 49 regions. Check which VM sizes are available, compare multiple regions, view historical data, and get alternative recommendations instantly.

**🌐 Live at: [www.azsize.com](https://www.azsize.com)**

![azsize.com](https://img.shields.io/badge/status-live-brightgreen) ![Azure](https://img.shields.io/badge/Azure-VM%20Checker-0078D4) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### Core Functionality
- ✅ **Real-time Azure API Integration** - Direct calls to Azure Compute Management API
- ✅ **49 Azure Regions** - Full global coverage
- ✅ **24 VM Series** - D, E, F, B, N, L, M, and more
- ✅ **Live Availability Checking** - See what's available right now
- ✅ **Pricing Information** - Monthly cost estimates per VM
- ✅ **Restriction Details** - Quota, zone, and location restrictions

### Smart Features
- 🔄 **Multi-Region Comparison** - Compare availability across multiple regions side-by-side
- 📊 **Historical Data** - See availability trends over the last 7 days (37 popular VMs tracked hourly)
- 💡 **Alternative Recommendations** - When a VM is unavailable, get suggestions for similar available VMs
- 📥 **CSV Export** - Download results with full specifications, pricing, and restrictions
- 🔗 **Deep Linking** - Share searches via URL parameters
- 📋 **One-Click Sharing** - Copy URL to clipboard

### User Experience
- ⚡ **Fast & Responsive** - Optimized React UI with animated loading states
- 📱 **Mobile-Friendly** - Fully responsive design
- 🎨 **Modern UI** - Clean interface with hover effects and smooth animations
- 🆓 **100% Free** - No rate limits, no authentication required

## 🛠️ Tech Stack

- **Frontend**: React with modern hooks
- **Backend**: Azure Functions (Node.js 20)
- **Hosting**: Azure Static Web Apps
- **API**: Azure Compute Management REST API (direct HTTPS calls)
- **Database**: Azure Table Storage (historical data)
- **Data Collection**: Separate Azure Function App with timer trigger (hourly)
- **Deployment**: GitHub Actions (auto-deploy on push)

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

## 🏗️ Architecture

### Main Application (Static Web App)
- **Frontend**: React SPA hosted on Azure Static Web Apps
- **HTTP Functions**:
  - `GetVMAvailability` - Checks VM availability via Azure Compute API
  - `GetHistoricalData` - Queries Azure Table Storage for historical trends

### Data Collection (Separate Function App)
- **Timer Function**: `CollectAvailabilityData` runs hourly
- **Tracks**: 37 popular VM sizes across 10 major regions
- **Storage**: Azure Table Storage (`azsizedata` account)
- **Why Separate**: Azure Static Web Apps don't support timer triggers

### API Endpoints

#### Check VM Availability
```
GET /api/GetVMAvailability?region={region}&seriesFilter={series}
```
Returns: Array of VM sizes with availability, pricing, and restrictions

#### Get Historical Data
```
GET /api/GetHistoricalData?region={region}&vmSize={size}&days={days}
```
Returns: Availability percentage over specified time period

## 🎯 Roadmap

### Completed (v1.0 - Live)
- [x] Real Azure API integration (all 49 regions)
- [x] 24 VM series support
- [x] Historical availability data (7-day tracking)
- [x] Multi-region comparison
- [x] Alternative VM recommendations
- [x] CSV export
- [x] Deep linking & sharing
- [x] SEO optimization
- [x] Google Analytics

### Coming Soon (v1.1)
- [ ] Google AdSense integration
- [ ] Email alerts for availability changes
- [ ] Price comparison charts
- [ ] Regional cost comparison
- [ ] Save favorite VM configurations

### Future (v2.0+)
- [ ] CLI tool for DevOps workflows
- [ ] API access for developers
- [ ] AI-powered VM recommendations
- [ ] Team collaboration features
- [ ] Terraform/ARM template generation

## 💰 Monetization Strategy

### Website (Current)
- **100% Free** - No rate limits, no authentication
- **Revenue**: Google Ads + Azure training sponsorships
- **Goal**: Maximum adoption, SEO, brand awareness

### CLI Tool (Future)
- **Free Tier**: 50 checks/month
- **Pro ($9/mo)**: Unlimited checks, historical data, API access
- **Enterprise ($49/mo for 5 users)**: AI recommendations, team features, SLA

## 📊 Example Use Cases

### 1. Multi-Region Availability Check
Need to deploy VMs across multiple regions? Toggle "Compare Multiple Regions" and select regions to see side-by-side availability.

### 2. Find Alternative VMs
When your preferred VM is unavailable, azsize.com automatically suggests similar VMs with matching vCPU count and similar memory.

### 3. Historical Trends
Before committing to a VM size, check its 7-day availability percentage to understand if capacity issues are common.

### 4. Share Searches
Use the Share button to copy a direct link to your search, perfect for team collaboration or support tickets.

### 5. Export Data
Download CSV exports with full VM specifications, pricing, and restrictions for reporting or analysis.

## 🔗 Deep Linking Examples

Share direct links to searches:

```
# Single region search
https://www.azsize.com/?region=eastus&series=Standard_D

# Multi-region comparison
https://www.azsize.com/?compare=true&regions=eastus,westus2,centralus&series=Standard_E
```

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Feedback

Have suggestions or found a bug? We'd love to hear from you:
- Open an issue on GitHub
- Use the feedback form on [www.azsize.com](https://www.azsize.com)

---

**Built for the Azure community**

Star this repo if you find it useful! ⭐
