export const METRIC_DESCRIPTIONS = {
    dailyMentions: "Total number of posts and comments mentioning Corepunk across all platforms. Tracks overall discussion volume and community activity.",

    engagementScore: "Calculated engagement metric combining likes, comments, shares and reach. Higher scores indicate stronger community interaction and content resonance.",

    likes: "Total number of likes/upvotes across all platforms. Includes Reddit upvotes, YouTube likes, VK likes, and TikTok hearts. Measures positive reception.",

    totalComments: "Total number of comments and replies across all platforms. Indicates active discussion and community participation depth.",

    reach: "Total number of views and impressions across all content. Measures content visibility and potential audience size.",

    sentimentPercent: "Percentage of positive sentiment in community discussions. Calculated using AI analysis of comment text. Higher percentages indicate more positive community mood.",

    negativeComments: "Number of comments with negative sentiment detected by AI. Useful for identifying issues, concerns, or negative feedback trends."
};

export type MetricKey = keyof typeof METRIC_DESCRIPTIONS;
