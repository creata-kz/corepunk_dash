/**
 * Тест для проверки разрешений (RLS) в Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://owysigjwaciduiylwtfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXNpZ2p3YWNpZHVpeWx3dGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjQ0NzcsImV4cCI6MjA3NTI0MDQ3N30.sZ7QCK3g-Dt7vpe_j-7Rrs0N-M0hyoPJrJ6ieI0izXQ';

async function testPermissions() {
  console.log('🔌 Connecting to Supabase...\n');

  const client = createClient(supabaseUrl, supabaseKey);

  // Test 1: metric_snapshots table
  console.log('📊 Test 1: Checking metric_snapshots table...');
  try {
    const { data, error } = await client
      .from('metric_snapshots')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} records`);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  // Test 2: events table (последние 90 дней)
  console.log('\n📥 Test 2: Checking events table (last 90 days)...');
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data, error } = await client
      .from('events')
      .select('event_id, event_timestamp, platform, event_type')
      .gte('event_timestamp', startDate.toISOString())
      .limit(10);

    if (error) {
      console.error('❌ Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log('Sample:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  // Test 3: events table (ALL данные без фильтра по дате)
  console.log('\n📥 Test 3: Checking events table (no date filter)...');
  try {
    const { data, error, count } = await client
      .from('events')
      .select('event_id, event_timestamp, platform', { count: 'exact' })
      .limit(10);

    if (error) {
      console.error('❌ Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`✅ Success! Total count: ${count}, returned ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log('First event:', data[0]);
        console.log('Last event:', data[data.length - 1]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  // Test 4: strategic_briefs table
  console.log('\n📄 Test 4: Checking strategic_briefs table...');
  try {
    const { data, error } = await client
      .from('strategic_briefs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} records`);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }

  console.log('\n✅ All tests complete!');
}

testPermissions();
