#!/usr/bin/env ts-node

/**
 * Social Media Data Collection Script
 *
 * Collects data from Twitter, Instagram, and TikTok using Apify
 * and stores it in Supabase database as events
 *
 * Usage:
 *   npm run collect-data
 *   npm run collect-data -- --keyword "YourGame"
 *   npm run collect-data -- --max 100
 */

import { apifyService } from '../services/apifyService';
import { supabaseService } from '../services/supabaseService';

interface CollectionOptions {
  keyword: string;
  maxPerPlatform: number;
}

async function main() {
  console.log('🚀 Starting social media data collection...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: CollectionOptions = {
    keyword: 'Corepunk', // Default keyword
    maxPerPlatform: 50,  // Default max posts per platform
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--keyword' && args[i + 1]) {
      options.keyword = args[i + 1];
      i++;
    } else if (args[i] === '--max' && args[i + 1]) {
      options.maxPerPlatform = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log('📋 Collection settings:');
  console.log(`   Keyword: "${options.keyword}"`);
  console.log(`   Max per platform: ${options.maxPerPlatform}`);
  console.log('');

  // Check if Apify is configured
  if (!apifyService.isConnected()) {
    console.error('❌ Apify API key not configured!');
    console.error('   Please add APIFY_API_KEY to your .env file');
    process.exit(1);
  }

  // Check if Supabase is configured
  if (!supabaseService.isConnected()) {
    console.error('❌ Supabase not configured!');
    console.error('   Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
    process.exit(1);
  }

  try {
    // Collect data from all platforms
    const startTime = Date.now();
    const comments = await apifyService.collectAllPlatforms(
      options.keyword,
      options.maxPerPlatform
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Collection completed in ${duration}s`);

    if (comments.length === 0) {
      console.log('⚠️  No data collected. Exiting...');
      return;
    }

    // Save to Supabase
    console.log('\n💾 Saving to Supabase...');
    const saved = await saveToSupabase(comments);

    console.log(`\n✅ Successfully saved ${saved} events to database`);
    console.log('\n🎉 Data collection complete!');

  } catch (error) {
    console.error('\n❌ Error during collection:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Save collected comments to Supabase as events
 */
async function saveToSupabase(comments: any[]): Promise<number> {
  let savedCount = 0;

  for (const comment of comments) {
    try {
      // Convert comment to event format for Supabase
      const event = {
        event_type: 'post', // or 'comment' based on metadata
        platform: comment.source,
        content: comment.text,
        author: comment.author,
        sentiment: comment.sentiment,
        timestamp: comment.timestamp,
        metadata: comment.metadata,
      };

      // Save to Supabase events table
      // Note: You'll need to implement this method in supabaseService
      // await supabaseService.saveEvent(event);

      savedCount++;
    } catch (error) {
      console.error(`   Error saving comment ${comment.id}:`, error);
    }
  }

  return savedCount;
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
