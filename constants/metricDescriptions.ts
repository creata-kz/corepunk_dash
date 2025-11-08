export const METRIC_DESCRIPTIONS = {
    dailyMentions: "Total number of posts and comments mentioning Corepunk across all platforms. Tracks overall discussion volume and community activity.",

    engagementScore: "Calculated engagement metric combining likes, comments, and reach. Formula: Likes × 1.5 + Comments × 2 + Reach × 0.1. Higher scores indicate stronger community interaction and content resonance.",

    likes: "Total number of likes/upvotes across all platforms. Includes Reddit upvotes, YouTube likes, VK likes, and TikTok hearts. Measures positive reception.",

    totalComments: "Total number of comments and replies across all platforms. Indicates active discussion and community participation depth.",

    positiveComments: "Number of comments with positive sentiment detected by AI. Shows enthusiastic community engagement and satisfaction levels.",

    reach: "Total number of views and impressions across all content. Measures content visibility and potential audience size.",

    sentimentPercent: "Percentage of positive sentiment in community discussions. Calculated using AI analysis of comment text. Higher percentages indicate more positive community mood.",

    negativeComments: "Number of comments with negative sentiment detected by AI. Useful for identifying issues, concerns, or negative feedback trends.",

    avgMentionsPerDay: "Average number of daily mentions across the selected period. Shows consistent community engagement level and discussion frequency.",

    engagementRate: "Percentage of engagement relative to reach. Calculated as (Engagement Score / Reach) × 100. Higher rates indicate more active audience participation.",

    topPlatform: "Platform with the highest total mentions during the selected period. Helps identify where your community is most active."
};

export type MetricKey = keyof typeof METRIC_DESCRIPTIONS;
