const https = require('https');
const { initTable, bulkInsertAvailabilityChecks, getStats } = require('../shared/database');

// Popular VM sizes to track (start with top 50)
const POPULAR_VMS = [
    // B-series (Burstable)
    'Standard_B1s', 'Standard_B2s', 'Standard_B2ms', 'Standard_B4ms',
    // D-series (General Purpose)
    'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3',
    'Standard_D2s_v4', 'Standard_D4s_v4', 'Standard_D8s_v4',
    'Standard_D2s_v5', 'Standard_D4s_v5', 'Standard_D8s_v5',
    'Standard_D2ds_v4', 'Standard_D4ds_v4',
    // E-series (Memory Optimized)
    'Standard_E2s_v3', 'Standard_E4s_v3', 'Standard_E8s_v3',
    'Standard_E2s_v4', 'Standard_E4s_v4', 'Standard_E8s_v4',
    'Standard_E2s_v5', 'Standard_E4s_v5',
    // F-series (Compute Optimized)
    'Standard_F2s_v2', 'Standard_F4s_v2', 'Standard_F8s_v2',
    // A-series
    'Standard_A2_v2', 'Standard_A4_v2',
    // GPU
    'Standard_NC4as_T4_v3', 'Standard_NC6s_v3',
    // HPC
    'Standard_HB120rs_v2'
];

// Popular regions to track (start with top 10)
const POPULAR_REGIONS = [
    'eastus', 'eastus2', 'westus2', 'centralus',
    'northeurope', 'westeurope',
    'southeastasia', 'eastasia',
    'australiaeast', 'japaneast'
];

module.exports = async function (context, myTimer) {
    const timestamp = new Date().toISOString();
    context.log('CollectAvailabilityData timer trigger starting at:', timestamp);

    try {
        // Initialize Table Storage
        await initTable();

        // Get Azure credentials
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

        if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
            throw new Error('Azure credentials not configured');
        }

        // Get access token
        context.log('Getting Azure access token...');
        const accessToken = await getAccessToken(tenantId, clientId, clientSecret);

        const checks = [];
        let totalChecked = 0;

        // Check each region
        for (const region of POPULAR_REGIONS) {
            context.log(`Checking region: ${region}`);

            try {
                // Get all VM sizes for this region
                const vmSizes = await getVMSizes(subscriptionId, region, accessToken);
                const skus = await getResourceSKUs(subscriptionId, region, accessToken);

                // Filter to only popular VMs
                const popularVMsInRegion = vmSizes.filter(vm =>
                    POPULAR_VMS.includes(vm.name)
                );

                for (const vm of popularVMsInRegion) {
                    const sku = skus.find(s => s.name === vm.name);

                    let available = true;
                    let restriction = null;

                    if (sku && sku.restrictions && sku.restrictions.length > 0) {
                        const locationRestrictions = sku.restrictions.filter(r =>
                            r.type === 'Location' &&
                            r.values &&
                            r.values.some(v => v.toLowerCase() === region.toLowerCase())
                        );

                        if (locationRestrictions.length > 0) {
                            available = false;
                            restriction = locationRestrictions[0].reasonCode;
                        }
                    }

                    const pricePerMonth = estimatePrice(vm.name, vm.numberOfCores, vm.memoryInMB);

                    checks.push({
                        timestamp,
                        region,
                        vmSize: vm.name,
                        available,
                        restriction,
                        pricePerMonth
                    });

                    totalChecked++;
                }

            } catch (error) {
                context.log.error(`Error checking region ${region}:`, error.message);
                // Continue with next region
            }
        }

        // Bulk insert all checks
        if (checks.length > 0) {
            context.log(`Inserting ${checks.length} availability checks into database...`);
            bulkInsertAvailabilityChecks(checks);

            // Get updated stats
            const stats = getStats();
            context.log('Database stats:', stats);
            context.log(`Successfully collected ${totalChecked} availability checks across ${POPULAR_REGIONS.length} regions`);
        } else {
            context.log.warn('No availability data collected');
        }

    } catch (error) {
        context.log.error('Error in CollectAvailabilityData:', error);
        throw error;
    }
};

// Get Azure AD access token
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
                    reject(new Error(`Failed to get VM sizes: ${res.statusCode}`));
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
                    reject(new Error(`Failed to get resource SKUs: ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Simple price estimation
function estimatePrice(vmName, cores, memoryMB) {
    const memoryGB = memoryMB / 1024;
    const coreRate = 35;
    const ramRate = 4;

    let multiplier = 1.0;
    if (vmName.includes('_B')) multiplier = 0.3;
    if (vmName.includes('_E')) multiplier = 1.2;
    if (vmName.includes('_F')) multiplier = 0.9;
    if (vmName.includes('_M')) multiplier = 2.0;
    if (vmName.includes('_N')) multiplier = 3.0;

    if (vmName.includes('_v5') || vmName.includes('_v6')) {
        multiplier *= 0.95;
    }

    const basePrice = (cores * coreRate) + (memoryGB * ramRate);
    return Math.round(basePrice * multiplier);
}
