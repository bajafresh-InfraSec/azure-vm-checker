const { ComputeManagementClient } = require("@azure/arm-compute");
const { ClientSecretCredential } = require("@azure/identity");

// In-memory cache with 15-minute TTL
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

module.exports = async function (context, req) {
    context.log('VM Availability check requested');

    // Get parameters from query string or body
    const location = req.query.location || (req.body && req.body.location) || 'centralus';
    const vmSeries = req.query.series || (req.body && req.body.series) || 'Standard_D';

    // Enable CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers };
        return;
    }

    try {
        // Check cache first
        const cacheKey = `${location}-${vmSeries}`;
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            context.log('Returning cached data');
            context.res = {
                status: 200,
                headers,
                body: {
                    ...cached.data,
                    cached: true,
                    cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
                }
            };
            return;
        }

        // Initialize Azure credentials
        const credential = new ClientSecretCredential(
            process.env.AZURE_TENANT_ID,
            process.env.AZURE_CLIENT_ID,
            process.env.AZURE_CLIENT_SECRET
        );

        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const client = new ComputeManagementClient(credential, subscriptionId);

        context.log(`Fetching VM sizes for ${location} with series ${vmSeries}`);

        // Get all VM sizes available in the region
        const vmSizes = [];
        for await (const size of client.virtualMachineSizes.list(location)) {
            // Filter by series prefix
            if (size.name.startsWith(vmSeries)) {
                vmSizes.push(size);
            }
        }

        context.log(`Found ${vmSizes.length} VM sizes`);

        // Check resource SKUs for availability restrictions
        const skuClient = client.resourceSkus;
        const skus = [];
        for await (const sku of skuClient.list()) {
            if (sku.resourceType === 'virtualMachines' &&
                sku.locations &&
                sku.locations.some(loc => loc.toLowerCase() === location.toLowerCase())) {
                skus.push(sku);
            }
        }

        // Build result with availability information
        const results = vmSizes.map(vm => {
            const sku = skus.find(s => s.name === vm.name);

            // Check if SKU has restrictions
            let available = true;
            let restrictions = [];

            if (sku && sku.restrictions && sku.restrictions.length > 0) {
                const locationRestrictions = sku.restrictions.filter(r =>
                    r.type === 'Location' &&
                    r.values &&
                    r.values.some(v => v.toLowerCase() === location.toLowerCase())
                );

                if (locationRestrictions.length > 0) {
                    available = false;
                    restrictions = locationRestrictions.map(r => r.reasonCode);
                }
            }

            // Estimate pricing (simplified - real pricing would use Azure Retail Prices API)
            const pricePerMonth = estimatePrice(vm.name, vm.numberOfCores, vm.memoryInMB);

            return {
                name: vm.name,
                vCPUs: vm.numberOfCores,
                memoryGB: Math.round(vm.memoryInMB / 1024),
                available: available,
                restrictions: restrictions.length > 0 ? restrictions : undefined,
                pricePerMonth: pricePerMonth,
                maxDataDisks: vm.maxDataDiskCount,
                osDiskSizeGB: vm.osDiskSizeInMB ? Math.round(vm.osDiskSizeInMB / 1024) : undefined,
                resourceDiskSizeGB: vm.resourceDiskSizeInMB ? Math.round(vm.resourceDiskSizeInMB / 1024) : undefined
            };
        });

        // Sort by vCPUs, then by memory
        results.sort((a, b) => {
            if (a.vCPUs !== b.vCPUs) return a.vCPUs - b.vCPUs;
            return a.memoryGB - b.memoryGB;
        });

        const responseData = {
            location: location,
            series: vmSeries,
            vms: results,
            timestamp: new Date().toISOString(),
            cached: false
        };

        // Cache the results
        cache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        context.res = {
            status: 200,
            headers,
            body: responseData
        };

    } catch (error) {
        context.log.error('Error fetching VM availability:', error);
        context.res = {
            status: 500,
            headers,
            body: {
                error: 'Failed to retrieve VM availability',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
};

// Simple price estimation based on VM specs
// In production, use Azure Retail Prices API for accurate pricing
function estimatePrice(vmName, cores, memoryMB) {
    const memoryGB = memoryMB / 1024;

    // Base rates per core and GB RAM (rough estimates)
    const coreRate = 35; // $35/core/month
    const ramRate = 4;   // $4/GB/month

    // Series multipliers
    let multiplier = 1.0;
    if (vmName.includes('_B')) multiplier = 0.3;  // Burstable - cheaper
    if (vmName.includes('_E')) multiplier = 1.2;  // Memory optimized - more expensive
    if (vmName.includes('_F')) multiplier = 0.9;  // Compute optimized
    if (vmName.includes('_M')) multiplier = 2.0;  // Large memory - very expensive
    if (vmName.includes('_N')) multiplier = 3.0;  // GPU - extremely expensive

    // v5/v6 are slightly cheaper than v3/v4
    if (vmName.includes('_v5') || vmName.includes('_v6')) {
        multiplier *= 0.95;
    }

    const basePrice = (cores * coreRate) + (memoryGB * ramRate);
    return Math.round(basePrice * multiplier);
}
