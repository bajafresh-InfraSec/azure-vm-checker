const supabase = require('./supabase');
const crypto = require('crypto');

/**
 * Check authentication from request headers
 * @param {Object} req - Azure Functions request object
 * @returns {Object} - { user, apiKeyId, anonymous, error }
 */
async function checkAuth(req) {
  // 1. Check for API key (CLI usage)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, profiles(*)')
      .eq('key_hash', keyHash)
      .eq('revoked', false)
      .single();

    if (error || !keyData) {
      return { error: 'Invalid API key', status: 401 };
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return { user: keyData.profiles, apiKeyId: keyData.id };
  }

  // 2. Check for session token (website usage)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid session', status: 401 };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user: profile || { id: user.id, email: user.email, plan_type: 'free' } };
  }

  // 3. No auth = anonymous
  return { anonymous: true };
}

/**
 * Check if user has exceeded rate limit
 * @param {string} userId - User ID from Supabase
 * @param {string} planType - User's plan type (free, pro, enterprise)
 * @returns {Object} - { exceeded, count, limit, error }
 */
async function checkRateLimit(userId, planType = 'free') {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count, error } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth.toISOString());

  if (error) {
    return { exceeded: false, count: 0, limit: 50, error };
  }

  // Set limits based on plan type
  const limits = {
    free: 50,
    pro: 999999, // Unlimited
    enterprise: 999999 // Unlimited
  };

  const limit = limits[planType] || 50;

  if (count >= limit) {
    return { exceeded: true, count, limit };
  }

  return { exceeded: false, count, limit };
}

/**
 * Log API usage to Supabase
 * @param {string} userId - User ID
 * @param {string} apiKeyId - API Key ID (if used)
 * @param {string} endpoint - Endpoint name
 * @param {string} vmSize - VM size checked
 * @param {string} region - Region checked
 * @param {Object} req - Request object
 */
async function logUsage(userId, apiKeyId, endpoint, vmSize, region, req) {
  await supabase.from('usage_logs').insert({
    user_id: userId,
    api_key_id: apiKeyId || null,
    endpoint,
    vm_size: vmSize || null,
    region: region || null,
    ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null,
    user_agent: req.headers['user-agent'] || null
  });
}

module.exports = { checkAuth, checkRateLimit, logUsage };
