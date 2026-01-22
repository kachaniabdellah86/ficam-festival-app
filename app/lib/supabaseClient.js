import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE WITH YOUR REAL KEYS FROM SUPABASE WEBSITE ⚠️
const supabaseUrl = 'https://pzuxttposdpoiimqckpq.supabase.co';
const supabaseKey = 'sb_publishable_26TRBQ_wc8kg2UQRLjttzQ_SrWf6hJN';

export const supabase = createClient(supabaseUrl, supabaseKey);