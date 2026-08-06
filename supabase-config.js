import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vqlntcqsgsgbgwejwsen.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OKefDfosaW_yyjyLtLgMiA_3FyWl182';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);