import { Comment, Sentiment } from '../types';
import { aiService } from './geminiService';

/**
 * Apify Service for collecting social media data
 * Supports Twitter, Instagram, and TikTok data collection
 */

interface ApifyTwitterPost {
  id: string;
  text: string;
  author: {
    username: string;
    name: string;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };
  url: string;
}

interface ApifyInstagramPost {
  id: string;
  caption: string;
  username: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  url: string;
  displayUrl?: string;
}

interface ApifyTikTokPost {
  id: string;
  text: string;
  authorMeta: {
    name: string;
    nickName: string;
  };
  createTime: string;
  diggCount: number; // likes
  shareCount: number;
  commentCount: number;
  playCount: number; // views
  webVideoUrl: string;
}

class ApifyService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.apify.com/v2';
  private isInitialized = false;

  constructor() {
    this.apiKey = process.env.APIFY_API_KEY || null;
    this.isInitialized = !!this.apiKey;

    if (!this.isInitialized) {
      console.warn('⚠️ Apify API key not configured. Social media collection will be disabled.');
    } else {
      console.log('✅ Apify service initialized');
    }
  }

  /**
   * Check if Apify is connected
   */
  public isConnected(): boolean {
    return this.isInitialized;
  }

  /**
   * Collect Twitter posts mentioning a keyword
   * Using Twitter Scraper actor
   * @param keyword - Search keyword (e.g., "Corepunk")
   * @param maxPosts - Maximum number of posts to collect
   * @returns Array of Comment objects
   */
  public async collectTwitterPosts(keyword: string, maxPosts: number = 100): Promise<Comment[]> {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('Apify not configured, skipping Twitter collection');
      return [];
    }

    try {
      console.log(`🐦 Collecting Twitter posts for "${keyword}"...`);

      // Twitter Scraper Actor ID
      const actorId = 'apidojo/tweet-scraper';

      const input = {
        searchTerms: [keyword],
        maxTweets: maxPosts,
        addUserInfo: true,
        includeSearchTerms: true,
      };

      const runUrl = `${this.baseUrl}/acts/${actorId}/runs?token=${this.apiKey}`;

      // Start the actor run
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to start Twitter scraper: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      console.log(`   Run started: ${runId}`);

      // Wait for the run to complete
      await this.waitForRun(runId);

      // Get the results
      const resultsUrl = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiKey}`;
      const resultsResponse = await fetch(resultsUrl);

      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch Twitter results: ${resultsResponse.statusText}`);
      }

      const posts: ApifyTwitterPost[] = await resultsResponse.json();

      console.log(`   ✅ Collected ${posts.length} Twitter posts`);

      // Convert to Comment format with AI sentiment analysis
      const comments = await this.convertTwitterToComments(posts);

      return comments;
    } catch (error) {
      console.error('Error collecting Twitter data:', error);
      return [];
    }
  }

  /**
   * Collect Instagram posts mentioning a hashtag
   * Using Instagram Scraper actor
   * @param hashtag - Hashtag to search (without #)
   * @param maxPosts - Maximum number of posts to collect
   * @returns Array of Comment objects
   */
  public async collectInstagramPosts(hashtag: string, maxPosts: number = 100): Promise<Comment[]> {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('Apify not configured, skipping Instagram collection');
      return [];
    }

    try {
      console.log(`📸 Collecting Instagram posts for #${hashtag}...`);

      const actorId = 'apify/instagram-hashtag-scraper';

      const input = {
        hashtags: [hashtag],
        resultsLimit: maxPosts,
      };

      const runUrl = `${this.baseUrl}/acts/${actorId}/runs?token=${this.apiKey}`;

      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to start Instagram scraper: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      console.log(`   Run started: ${runId}`);

      await this.waitForRun(runId);

      const resultsUrl = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiKey}`;
      const resultsResponse = await fetch(resultsUrl);

      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch Instagram results: ${resultsResponse.statusText}`);
      }

      const posts: ApifyInstagramPost[] = await resultsResponse.json();

      console.log(`   ✅ Collected ${posts.length} Instagram posts`);

      const comments = await this.convertInstagramToComments(posts);

      return comments;
    } catch (error) {
      console.error('Error collecting Instagram data:', error);
      return [];
    }
  }

  /**
   * Collect TikTok posts mentioning a keyword
   * Using TikTok Scraper actor
   * @param keyword - Search keyword
   * @param maxPosts - Maximum number of posts to collect
   * @returns Array of Comment objects
   */
  public async collectTikTokPosts(keyword: string, maxPosts: number = 100): Promise<Comment[]> {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('Apify not configured, skipping TikTok collection');
      return [];
    }

    try {
      console.log(`🎵 Collecting TikTok posts for "${keyword}"...`);

      const actorId = 'clockworks/tiktok-scraper';

      const input = {
        searchQueries: [keyword],
        resultsPerPage: maxPosts,
      };

      const runUrl = `${this.baseUrl}/acts/${actorId}/runs?token=${this.apiKey}`;

      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to start TikTok scraper: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      console.log(`   Run started: ${runId}`);

      await this.waitForRun(runId);

      const resultsUrl = `${this.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.apiKey}`;
      const resultsResponse = await fetch(resultsUrl);

      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch TikTok results: ${resultsResponse.statusText}`);
      }

      const posts: ApifyTikTokPost[] = await resultsResponse.json();

      console.log(`   ✅ Collected ${posts.length} TikTok posts`);

      const comments = await this.convertTikTokToComments(posts);

      return comments;
    } catch (error) {
      console.error('Error collecting TikTok data:', error);
      return [];
    }
  }

  /**
   * Wait for an Apify actor run to complete
   */
  private async waitForRun(runId: string, maxWaitTime: number = 300000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const statusUrl = `${this.baseUrl}/actor-runs/${runId}?token=${this.apiKey}`;
      const response = await fetch(statusUrl);

      if (!response.ok) {
        throw new Error(`Failed to check run status: ${response.statusText}`);
      }

      const data = await response.json();
      const status = data.data.status;

      if (status === 'SUCCEEDED') {
        console.log(`   ✅ Run completed successfully`);
        return;
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Run ${status.toLowerCase()}`);
      }

      // Still running, wait before next check
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Run timed out');
  }

  /**
   * Convert Twitter posts to Comment format
   */
  private async convertTwitterToComments(posts: ApifyTwitterPost[]): Promise<Comment[]> {
    const texts = posts.map(p => p.text);
    const sentiments = await aiService.analyzeSentimentBatch(texts);

    return posts.map((post, index) => ({
      id: Math.random() * 1000000,
      activityId: 0, // Will be set when saving to DB
      text: post.text,
      author: post.author.username,
      sentiment: sentiments[index] as Sentiment,
      userType: 'Viewer' as const,
      source: 'Twitter',
      timestamp: post.createdAt,
      metadata: {
        score: post.metrics.likes,
        likes: post.metrics.likes,
        views: post.metrics.views,
        url: post.url,
        is_post: true,
        post_id: post.id,
      }
    }));
  }

  /**
   * Convert Instagram posts to Comment format
   */
  private async convertInstagramToComments(posts: ApifyInstagramPost[]): Promise<Comment[]> {
    const texts = posts.map(p => p.caption || 'No caption');
    const sentiments = await aiService.analyzeSentimentBatch(texts);

    return posts.map((post, index) => ({
      id: Math.random() * 1000000,
      activityId: 0,
      text: post.caption || 'No caption',
      author: post.username,
      sentiment: sentiments[index] as Sentiment,
      userType: 'Viewer' as const,
      source: 'Instagram',
      timestamp: post.timestamp,
      metadata: {
        score: post.likesCount,
        likes: post.likesCount,
        url: post.url,
        is_post: true,
        post_id: post.id,
      }
    }));
  }

  /**
   * Convert TikTok posts to Comment format
   */
  private async convertTikTokToComments(posts: ApifyTikTokPost[]): Promise<Comment[]> {
    const texts = posts.map(p => p.text || 'No description');
    const sentiments = await aiService.analyzeSentimentBatch(texts);

    return posts.map((post, index) => ({
      id: Math.random() * 1000000,
      activityId: 0,
      text: post.text || 'No description',
      author: post.authorMeta.nickName || post.authorMeta.name,
      sentiment: sentiments[index] as Sentiment,
      userType: 'Viewer' as const,
      source: 'Tiktok',
      timestamp: new Date(parseInt(post.createTime) * 1000).toISOString(),
      metadata: {
        score: post.diggCount,
        likes: post.diggCount,
        views: post.playCount,
        url: post.webVideoUrl,
        is_post: true,
        post_id: post.id,
      }
    }));
  }

  /**
   * Collect data from all platforms for a keyword
   * @param keyword - Search keyword
   * @param maxPerPlatform - Max posts per platform
   * @returns Combined array of all comments
   */
  public async collectAllPlatforms(keyword: string, maxPerPlatform: number = 50): Promise<Comment[]> {
    if (!this.isInitialized) {
      console.warn('⚠️ Apify not configured, cannot collect social media data');
      return [];
    }

    console.log(`🌐 Starting multi-platform collection for "${keyword}"...`);

    // Run all collections in parallel for speed
    const [twitterData, instagramData, tiktokData] = await Promise.all([
      this.collectTwitterPosts(keyword, maxPerPlatform),
      this.collectInstagramPosts(keyword, maxPerPlatform),
      this.collectTikTokPosts(keyword, maxPerPlatform),
    ]);

    const allComments = [...twitterData, ...instagramData, ...tiktokData];

    console.log(`✅ Total collected: ${allComments.length} posts across all platforms`);
    console.log(`   - Twitter: ${twitterData.length}`);
    console.log(`   - Instagram: ${instagramData.length}`);
    console.log(`   - TikTok: ${tiktokData.length}`);

    return allComments;
  }
}

export const apifyService = new ApifyService();
