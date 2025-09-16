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
  dau: number;
  revenue: number;
  retention: number;
  negativeComments: number;
  likes: number;
  shares: number;
  reach: number;
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
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export type DateRange = '7d' | '30d' | '90d';
