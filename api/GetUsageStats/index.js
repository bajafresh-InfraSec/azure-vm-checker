const supabase = require('../shared/supabase');

module.exports = async function (context, req) {
  context.log('Usage stats requested');

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
        body: { error: 'Unauthorized' }
      };
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      context.res = {
        status: 401,
        headers,
        body: { error: 'Invalid session' }
      };
      return;
    }

    // Get user profile for plan type
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const planType = profile?.plan_type || 'free';

    // Calculate current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { count, error } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('timestamp', startOfMonth.toISOString());

    if (error) {
      context.log.error('Error fetching usage:', error);
      context.res = {
        status: 500,
        headers,
        body: { error: 'Failed to fetch usage stats' }
      };
      return;
    }

    // Set limits based on plan
    const limits = {
      free: 50,
      pro: 999999, // Unlimited
      enterprise: 999999 // Unlimited
    };

    const limit = limits[planType] || 50;

    context.res = {
      status: 200,
      headers,
      body: {
        usage: {
          used: count || 0,
          limit: limit,
          remaining: Math.max(0, limit - (count || 0)),
          percentage: Math.round(((count || 0) / limit) * 100)
        },
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
          resetDate: endOfMonth.toISOString()
        },
        plan: {
          type: planType,
          displayName: planType.charAt(0).toUpperCase() + planType.slice(1)
        }
      }
    };

  } catch (error) {
    context.log.error('Unexpected error:', error);
    context.res = {
      status: 500,
      headers,
      body: { error: 'Internal server error' }
    };
  }
};
