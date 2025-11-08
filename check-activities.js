/**
 * Проверка событий для Activity Feed
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://owysigjwaciduiylwtfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXNpZ2p3YWNpZHVpeWx3dGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjQ0NzcsImV4cCI6MjA3NTI0MDQ3N30.sZ7QCK3g-Dt7vpe_j-7Rrs0N-M0hyoPJrJ6ieI0izXQ';

async function checkActivities() {
  console.log('🔍 Checking Activity Feed events...\n');

  const client = createClient(supabaseUrl, supabaseKey);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const startDateStr = startDate.toISOString();

  // Query for activity events (same as supabaseService.getActivities)
  const { data, error } = await client
    .from('events')
    .select('*')
    .gte('event_timestamp', startDateStr)
    .in('event_type', [
      'release', 'hotfix', 'marketing_campaign',
      'community_event', 'pr_publication'
    ])
    .order('event_timestamp', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${data?.length || 0} activity events\n`);

  if (!data || data.length === 0) {
    console.log('⚠️ No activity events found in database!');
    console.log('   Activity Feed expects events with these types:');
    console.log('   - release');
    console.log('   - hotfix');
    console.log('   - marketing_campaign');
    console.log('   - community_event');
    console.log('   - pr_publication\n');
    console.log('💡 Suggestion: Create auto-generated activities from social media posts');
  } else {
    console.log('📋 Activity events:');
    data.forEach((event, i) => {
      const props = event.properties || {};
      console.log(`\n${i + 1}. ${event.event_type}`);
      console.log(`   Date: ${event.event_timestamp}`);
      console.log(`   Description: ${props.description || props.title || '(no description)'}`);
      console.log(`   Platforms: ${props.platforms?.join(', ') || event.platform}`);
    });
  }

  console.log('\n✅ Check complete!');
}

checkActivities();
