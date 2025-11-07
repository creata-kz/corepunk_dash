/**
 * Альтернативная реализация Supabase через прямые fetch запросы
 * Используем когда SDK не работает
 */

const SUPABASE_URL = 'https://owysigjwaciduiylwtfh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXNpZ2p3YWNpZHVpeWx3dGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjQ0NzcsImV4cCI6MjA3NTI0MDQ3N30.sZ7QCK3g-Dt7vpe_j-7Rrs0N-M0hyoPJrJ6ieI0izXQ';

async function supabaseFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log('🌐 Direct fetch to:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });

  console.log('🌐 Response status:', response.status);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('🌐 Response data length:', Array.isArray(data) ? data.length : 'not array');

  return data;
}

export async function fetchEvents() {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const data = await supabaseFetch('events', {
      'select': '*',
      'event_timestamp': `gte.${startDate.toISOString()}`,
      'order': 'event_timestamp.desc',
      'limit': '100'
    });

    console.log('✅ Fetched events via direct fetch:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Direct fetch error:', error);
    return [];
  }
}

export async function fetchMetricSnapshots() {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const startDateStr = startDate.toISOString().split('T')[0];

    const data = await supabaseFetch('metric_snapshots', {
      'select': '*',
      'snapshot_date': `gte.${startDateStr}`,
      'order': 'snapshot_date.asc'
    });

    console.log('✅ Fetched snapshots via direct fetch:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Direct fetch error:', error);
    return [];
  }
}
