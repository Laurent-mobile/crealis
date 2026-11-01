const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bkeylyqaujcewylrcmsq.supabase.co';
const supabaseKey = 'sb_publishable_H9Sgm4a-16dylaulH2LJsg_Bxdw9mzv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Tester la connexion en récupérant les tables
        const { data, error } = await supabase
            .from('Users')
            .select('count', { count: 'exact', head: true });

        if (error) throw error;
        console.log('✅ Connexion réussie à Supabase !');
        console.log('📊 Base de données accessible');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testConnection();
