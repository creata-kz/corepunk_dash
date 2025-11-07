/**
 * Тестовый скрипт для проверки подключения к Supabase
 * и наличия данных из Instagram и Twitter
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://owysigjwaciduiylwtfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXNpZ2p3YWNpZHVpeWx3dGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjQ0NzcsImV4cCI6MjA3NTI0MDQ3N30.sZ7QCK3g-Dt7vpe_j-7Rrs0N-M0hyoPJrJ6ieI0izXQ';

async function testSupabase() {
  console.log('🔌 Connecting to Supabase...');

  const client = createClient(supabaseUrl, supabaseKey);

  try {
    // Проверяем все события
    console.log('\n📊 Fetching all events...');
    const { data: allEvents, error: allError } = await client
      .from('events')
      .select('platform, event_type')
      .limit(1000);

    if (allError) {
      console.error('❌ Error fetching events:', allError);
      return;
    }

    // Подсчитываем по платформам
    const platformCounts = {};
    allEvents.forEach(event => {
      platformCounts[event.platform] = (platformCounts[event.platform] || 0) + 1;
    });

    console.log('\n📈 Platform distribution:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} events`);
    });

    // Проверяем Instagram
    console.log('\n📸 Checking Instagram data...');
    const { data: instaData, error: instaError } = await client
      .from('events')
      .select('*')
      .ilike('platform', 'instagram')
      .limit(5);

    if (instaError) {
      console.error('❌ Error fetching Instagram:', instaError);
    } else {
      console.log(`   Found ${instaData?.length || 0} Instagram events`);
      if (instaData && instaData.length > 0) {
        console.log('   Sample:', {
          type: instaData[0].event_type,
          timestamp: instaData[0].event_timestamp,
          properties: instaData[0].properties
        });
      }
    }

    // Проверяем Twitter
    console.log('\n🐦 Checking Twitter data...');
    const { data: twitterData, error: twitterError } = await client
      .from('events')
      .select('*')
      .ilike('platform', 'twitter')
      .limit(5);

    if (twitterError) {
      console.error('❌ Error fetching Twitter:', twitterError);
    } else {
      console.log(`   Found ${twitterData?.length || 0} Twitter events`);
      if (twitterData && twitterData.length > 0) {
        console.log('   Sample:', {
          type: twitterData[0].event_type,
          timestamp: twitterData[0].event_timestamp,
          properties: twitterData[0].properties
        });
      }
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabase();
