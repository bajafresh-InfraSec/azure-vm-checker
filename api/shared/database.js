const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

// Azure Table Storage configuration
const account = process.env.AZURE_STORAGE_ACCOUNT || 'azsizedata';
const accountKey = process.env.AZURE_STORAGE_KEY || '';
const tableName = 'AvailabilityChecks';

let tableClient = null;

// Initialize Table Storage client
function getTableClient() {
    if (!tableClient) {
        const credential = new AzureNamedKeyCredential(account, accountKey);
        tableClient = new TableClient(
            `https://${account}.table.core.windows.net`,
            tableName,
            credential
        );
    }
    return tableClient;
}

// Create table if it doesn't exist
async function initTable() {
    try {
        const client = getTableClient();
        await client.createTable();
    } catch (error) {
        // Table already exists or other error - ignore
        if (!error.message?.includes('TableAlreadyExists')) {
            console.error('Error creating table:', error.message);
        }
    }
}

// Insert availability check result
async function insertAvailabilityCheck(data) {
    const client = getTableClient();

    // Partition key: region
    // Row key: timestamp-vmSize (for unique constraint)
    const entity = {
        partitionKey: data.region,
        rowKey: `${data.timestamp}-${data.vmSize}`.replace(/:/g, '-'),
        timestamp: data.timestamp,
        region: data.region,
        vmSize: data.vmSize,
        available: data.available,
        restriction: data.restriction || '',
        pricePerMonth: data.pricePerMonth || 0
    };

    try {
        await client.upsertEntity(entity, 'Replace');
    } catch (error) {
        console.error('Error inserting entity:', error.message);
        throw error;
    }
}

// Bulk insert for efficiency
async function bulkInsertAvailabilityChecks(checks) {
    const client = getTableClient();

    // Table Storage doesn't have native batch across partitions
    // Group by partition (region) for batch operations
    const byPartition = {};

    for (const check of checks) {
        if (!byPartition[check.region]) {
            byPartition[check.region] = [];
        }
        byPartition[check.region].push({
            partitionKey: check.region,
            rowKey: `${check.timestamp}-${check.vmSize}`.replace(/:/g, '-'),
            timestamp: check.timestamp,
            region: check.region,
            vmSize: check.vmSize,
            available: check.available,
            restriction: check.restriction || '',
            pricePerMonth: check.pricePerMonth || 0
        });
    }

    // Insert each partition's entities
    const promises = [];
    for (const [partition, entities] of Object.entries(byPartition)) {
        for (const entity of entities) {
            promises.push(client.upsertEntity(entity, 'Replace').catch(e => console.error('Upsert error:', e.message)));
        }
    }

    await Promise.all(promises);
}

// Get availability percentage for last N days
async function getAvailabilityPercentage(vmSize, region, days = 7) {
    const client = getTableClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filter = `PartitionKey eq '${region}' and vmSize eq '${vmSize}' and timestamp ge datetime'${cutoffDate.toISOString()}'`;

    let totalChecks = 0;
    let availableCount = 0;

    const entities = client.listEntities({ queryOptions: { filter } });

    for await (const entity of entities) {
        totalChecks++;
        if (entity.available) {
            availableCount++;
        }
    }

    const availability_pct = totalChecks > 0 ? (availableCount * 100.0 / totalChecks) : 0;

    return {
        total_checks: totalChecks,
        available_count: availableCount,
        availability_pct
    };
}

// Get hourly availability pattern (not implemented for Table Storage - would be expensive)
async function getAvailabilityPattern(vmSize, region, days = 7) {
    // Simplified version - just return empty array
    // Full implementation would require querying all records and grouping by hour
    return [];
}

// Get historical data points (for charts)
async function getHistoricalData(vmSize, region, days = 7) {
    const client = getTableClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filter = `PartitionKey eq '${region}' and vmSize eq '${vmSize}' and timestamp ge datetime'${cutoffDate.toISOString()}'`;

    const results = [];
    const entities = client.listEntities({ queryOptions: { filter } });

    for await (const entity of entities) {
        results.push({
            timestamp: entity.timestamp,
            available: entity.available,
            restriction: entity.restriction
        });
    }

    return results;
}

// Get alternative VMs with better availability
async function getAlternatives(vmSize, region, days = 7) {
    // Table Storage doesn't support complex aggregations
    // This would require querying all records and aggregating client-side
    // For now, return empty array
    return [];
}

// Get best regions for a VM size
async function getBestRegions(vmSize, days = 7) {
    // Table Storage doesn't support cross-partition aggregations efficiently
    // This would require querying all partitions
    // For now, return empty array
    return [];
}

// Get database statistics
async function getStats() {
    const client = getTableClient();

    let totalRecords = 0;
    const vmSizes = new Set();
    const regions = new Set();
    let oldestRecord = null;
    let newestRecord = null;

    // Note: This queries ALL records which could be slow with large datasets
    // In production, you'd want to maintain these stats separately
    const entities = client.listEntities();

    for await (const entity of entities) {
        totalRecords++;
        vmSizes.add(entity.vmSize);
        regions.add(entity.region);

        const timestamp = new Date(entity.timestamp);
        if (!oldestRecord || timestamp < new Date(oldestRecord)) {
            oldestRecord = entity.timestamp;
        }
        if (!newestRecord || timestamp > new Date(newestRecord)) {
            newestRecord = entity.timestamp;
        }
    }

    return {
        total_records: totalRecords,
        unique_vms: vmSizes.size,
        unique_regions: regions.size,
        oldest_record: oldestRecord,
        newest_record: newestRecord
    };
}

module.exports = {
    initTable,
    insertAvailabilityCheck,
    bulkInsertAvailabilityChecks,
    getAvailabilityPercentage,
    getAvailabilityPattern,
    getHistoricalData,
    getAlternatives,
    getBestRegions,
    getStats
};
