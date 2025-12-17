const {
    getAvailabilityPercentage,
    getAvailabilityPattern,
    getHistoricalData,
    getAlternatives,
    getBestRegions,
    getStats
} = require('../shared/database');

module.exports = async function (context, req) {
    context.log('Historical data query requested');

    const vmSize = req.query.vmSize || req.query.vm_size;
    const region = req.query.region;
    const days = parseInt(req.query.days || '7');
    const type = req.query.type || 'percentage'; // percentage, pattern, timeline, alternatives, regions, stats

    // Enable CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers };
        return;
    }

    try {
        let result;

        switch (type) {
            case 'percentage':
                // Get availability percentage for a specific VM/region
                if (!vmSize || !region) {
                    throw new Error('vmSize and region are required for percentage query');
                }
                result = getAvailabilityPercentage(vmSize, region, days);
                break;

            case 'pattern':
                // Get hourly availability pattern
                if (!vmSize || !region) {
                    throw new Error('vmSize and region are required for pattern query');
                }
                result = getAvailabilityPattern(vmSize, region, days);
                break;

            case 'timeline':
                // Get historical data points for charts
                if (!vmSize || !region) {
                    throw new Error('vmSize and region are required for timeline query');
                }
                result = getHistoricalData(vmSize, region, days);
                break;

            case 'alternatives':
                // Get alternative VMs with better availability
                if (!vmSize || !region) {
                    throw new Error('vmSize and region are required for alternatives query');
                }
                result = getAlternatives(vmSize, region, days);
                break;

            case 'regions':
                // Get best regions for a VM size
                if (!vmSize) {
                    throw new Error('vmSize is required for regions query');
                }
                result = getBestRegions(vmSize, days);
                break;

            case 'stats':
                // Get database statistics
                result = getStats();
                break;

            default:
                throw new Error(`Unknown query type: ${type}`);
        }

        context.res = {
            status: 200,
            headers,
            body: {
                type,
                days,
                vmSize: vmSize || null,
                region: region || null,
                data: result,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Error querying historical data:', error);
        context.res = {
            status: error.message.includes('required') ? 400 : 500,
            headers,
            body: {
                error: 'Failed to query historical data',
                message: error.message
            }
        };
    }
};
