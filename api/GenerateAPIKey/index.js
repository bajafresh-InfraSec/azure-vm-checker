const supabase = require('../shared/supabase');
const crypto = require('crypto');

function generateAPIKey() {
  // Format: azsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const random = crypto.randomBytes(24).toString('hex');
  return `azsk_${random}`;
}

module.exports = async function (context, req) {
  context.log('API Key generation requested');

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  try {
    // Get user from auth header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      context.res = {
        status: 401,
        headers,
        body: { error: 'Unauthorized', message: 'Please login to generate an API key' }
      };
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      context.res = {
        status: 401,
        headers,
        body: { error: 'Invalid session', message: 'Please login again' }
      };
      return;
    }

    // Generate API key
    const apiKey = generateAPIKey();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 12) + '...';

    const keyName = req.body?.name || 'Default Key';

    // Store in database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: keyName
      })
      .select()
      .single();

    if (error) {
      context.log.error('Error creating API key:', error);
      context.res = {
        status: 500,
        headers,
        body: { error: 'Failed to create API key', message: error.message }
      };
      return;
    }

    context.res = {
      status: 200,
      headers,
      body: {
        success: true,
        apiKey: apiKey, // Only shown once!
        keyId: data.id,
        keyPrefix: keyPrefix,
        message: '⚠️ Save this key! It will not be shown again.',
        createdAt: data.created_at
      }
    };

  } catch (error) {
    context.log.error('Unexpected error:', error);
    context.res = {
      status: 500,
      headers,
      body: { error: 'Internal server error', message: error.message }
    };
  }
};
