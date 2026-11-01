//backend/src/config/supabase
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bkeylyqaujcewylrcmsq.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_H9Sgm4a-16dylaulH2LJsg_Bxdw9mzv';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
