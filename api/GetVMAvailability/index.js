const https = require('https');
const { checkAuth, checkRateLimit, logUsage } = require('../shared/auth');

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
    };

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers };
        return;
    }

    // Check authentication
    const auth = await checkAuth(req);

    // If authenticated user, check rate limit
    if (auth.user && !auth.anonymous) {
        const rateLimit = await checkRateLimit(auth.user.id, auth.user.plan_type);

        if (rateLimit.exceeded) {
            context.res = {
                status: 429,
                headers,
                body: {
                    error: 'Rate limit exceeded',
                    usage: { used: rateLimit.count, limit: rateLimit.limit },
                    message: 'You have used all your checks for this month. Upgrade to Pro for unlimited checks.',
                    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
                }
            };
            return;
        }
    }

    try {
        // Check cache first
        const cacheKey = `${location}-${vmSeries}`;
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            context.log('Returning cached data');

            // Log usage if authenticated
            if (auth.user && !auth.anonymous) {
                await logUsage(auth.user.id, auth.apiKeyId, 'check', vmSeries, location, req);
            }

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

        // Get Azure credentials from environment
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;

        if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
            throw new Error('Azure credentials not configured');
        }

        context.log('Getting access token...');

        // Get access token using client credentials flow
        const accessToken = await getAccessToken(tenantId, clientId, clientSecret);

        context.log(`Fetching VM sizes for ${location} with series ${vmSeries}`);

        // Get VM sizes from Azure REST API
        const vmSizes = await getVMSizes(subscriptionId, location, accessToken);

        // Filter by series
        const filteredVMs = vmSizes.filter(vm => vm.name.startsWith(vmSeries));

        context.log(`Found ${filteredVMs.length} VM sizes`);

        // Get resource SKUs to check availability
        const skus = await getResourceSKUs(subscriptionId, location, accessToken);

        // Build result with availability information
        const results = filteredVMs.map(vm => {
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

            // Estimate pricing
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

        // Log usage if authenticated
        if (auth.user && !auth.anonymous) {
            await logUsage(auth.user.id, auth.apiKeyId, 'check', vmSeries, location, req);
        }

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

// Get Azure AD access token using client credentials
function getAccessToken(tenantId, clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        const data = `grant_type=client_credentials&client_id=${clientId}&client_secret=${encodeURIComponent(clientSecret)}&resource=https://management.azure.com/`;

        const options = {
            hostname: 'login.microsoftonline.com',
            path: `/${tenantId}/oauth2/token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(body);
                    resolve(json.access_token);
                } else {
                    reject(new Error(`Failed to get access token: ${res.statusCode} ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Get VM sizes from Azure REST API
function getVMSizes(subscriptionId, location, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'management.azure.com',
            path: `/subscriptions/${subscriptionId}/providers/Microsoft.Compute/locations/${location}/vmSizes?api-version=2023-03-01`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(body);
                    resolve(json.value || []);
                } else {
                    reject(new Error(`Failed to get VM sizes: ${res.statusCode} ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Get resource SKUs from Azure REST API
function getResourceSKUs(subscriptionId, location, accessToken) {
    return new Promise((resolve, reject) => {
        const filter = encodeURIComponent(`location eq '${location}'`);
        const options = {
            hostname: 'management.azure.com',
            path: `/subscriptions/${subscriptionId}/providers/Microsoft.Compute/skus?api-version=2021-07-01&$filter=${filter}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(body);
                    const vmSkus = (json.value || []).filter(sku => sku.resourceType === 'virtualMachines');
                    resolve(vmSkus);
                } else {
                    reject(new Error(`Failed to get resource SKUs: ${res.statusCode} ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Simple price estimation based on VM specs
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
