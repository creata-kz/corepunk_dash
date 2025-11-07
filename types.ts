export enum ProductionActivityType {
  Release = "Release",
  Hotfix = "Hotfix",
  MarketingCampaign = "Marketing Campaign",
  CommunityEvent = "Community Event",
  PRPublication = "PR Publication",
}

export type ActivityStatus = "Upcoming" | "In Progress" | "Completed";

export interface ProductionActivity {
  id: number;
  type: ProductionActivityType;
  date: string; // YYYY-MM-DD format, acts as the main date for single-day events
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  description: string;
  status: ActivityStatus;
  platforms: string[]; // e.g. ['TikTok', 'YouTube']
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD format

  // Social metrics (replacing game metrics)
  dailyMentions: number;      // Replaces DAU - total posts + comments
  engagementScore: number;    // Replaces Revenue - calculated engagement
  sentimentPercent: number;   // Replaces Retention - % of positive comments

  // Existing social metrics
  likes: number;              // Upvotes, likes across platforms
  totalComments: number;      // Replaces Shares - total comments
  reach: number;              // Views, impressions
  negativeComments: number;   // Negative sentiment comments

  // Helper fields for calculations
  positiveComments?: number;  // For sentiment calculation
  posts?: number;             // For dailyMentions calculation

  // Platform breakdown
  byPlatform?: {
    [platform: string]: {
      dailyMentions: number;
      likes: number;
      comments: number;
      reach: number;
      negativeComments: number;
    };
  };
}

export type Sentiment = "Positive" | "Negative" | "Neutral";

export type UserType = "Player" | "Viewer";

export interface Comment {
    id: number;
    activityId: number;
    text: string;
    author: string;
    sentiment: Sentiment;
    userType: UserType;
    source: string; // 'YouTube', 'Twitter', 'Reddit', etc.
    timestamp: string;
    metadata?: {
        score?: number;
        likes?: number;
        views?: number;
        url?: string;
        post_id?: string; // ID поста (для Reddit комментариев)
        post_title?: string; // Заголовок поста (для Reddit комментариев)
        is_post?: boolean; // Это пост или комментарий
        video_urls?: string[]; // URLs видео (для VK постов)
    };
}

// Группированный пост с комментариями
export interface PostWithComments {
    post: Comment; // Сам пост
    comments: Comment[]; // Комментарии к посту
    totalComments: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export type DateRange = 'today' | 'all' | 'custom';

export interface CustomDateRange {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export type PlatformFilter = 'all' | 'Reddit' | 'Youtube' | 'Vk' | 'Discord' | 'Tiktok' | 'Instagram' | 'Twitter';
