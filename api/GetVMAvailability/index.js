const { ComputeManagementClient } = require("@azure/arm-compute");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    context.log('VM Availability check requested');

    // Get parameters from query string or body
    const location = req.query.location || (req.body && req.body.location) || 'centralus';
    const vmSeries = req.query.series || (req.body && req.body.series) || 'Standard_D';

    try {
        // For MVP, we'll use cached static data or user's own Azure credentials
        // In production, this would use a service principal

        // Simple mock data for testing without Azure credentials
        const mockData = generateMockData(location, vmSeries);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                location: location,
                series: vmSeries,
                vms: mockData,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Failed to retrieve VM availability',
                message: error.message
            }
        };
    }
};

// Mock data generator for MVP
function generateMockData(location, series) {
    const vmSizes = [
        { name: 'Standard_D2s_v3', vCPUs: 2, memoryGB: 8, available: true, pricePerMonth: 70 },
        { name: 'Standard_D2s_v4', vCPUs: 2, memoryGB: 8, available: true, pricePerMonth: 70 },
        { name: 'Standard_D2s_v5', vCPUs: 2, memoryGB: 8, available: false, pricePerMonth: 68 },
        { name: 'Standard_D4s_v3', vCPUs: 4, memoryGB: 16, available: true, pricePerMonth: 140 },
        { name: 'Standard_D4s_v4', vCPUs: 4, memoryGB: 16, available: true, pricePerMonth: 140 },
        { name: 'Standard_B2s', vCPUs: 2, memoryGB: 4, available: true, pricePerMonth: 30 },
        { name: 'Standard_B2ms', vCPUs: 2, memoryGB: 8, available: false, pricePerMonth: 60 }
    ];

    // Filter based on series
    return vmSizes.filter(vm => vm.name.startsWith(series));
}
