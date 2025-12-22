const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://epnrjmqjiqjndgbqaemx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_41Fsnwv4hmgBQFfUE13dnA_lx8zSRm9';

// Use service key for server-side operations (has admin privileges)
module.exports = createClient(supabaseUrl, supabaseServiceKey);
