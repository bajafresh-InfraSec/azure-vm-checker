import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://epnrjmqjiqjndgbqaemx.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_1R5I393AiMKDIIFIQj5OzA_Do1s3RoS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
