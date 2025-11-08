import { DailyMetric, ProductionActivity, ProductionActivityType, Comment, Sentiment, UserType } from '../types';

const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const createDate = (offset: number): Date => {
  const date = new Date(today);
  date.setDate(today.getDate() - offset);
  return date;
}

const formatOffsetDate = (offset: number): string => formatDate(createDate(offset));

export const generateInitialActivities = (): ProductionActivity[] => [
  {
    id: 1,
    type: ProductionActivityType.Release,
    date: formatOffsetDate(25),
    description: "Champion Class Rebalance (Nerf)",
    status: "Completed",
    platforms: ["In-Game"],
  },
  {
    id: 2,
    type: ProductionActivityType.CommunityEvent,
    date: formatOffsetDate(18),
    description: "Server Stress Test Weekend",
    status: "Completed",
    platforms: ["In-Game"],
  },
  {
    id: 3,
    type: ProductionActivityType.MarketingCampaign,
    date: formatOffsetDate(10),
    startDate: formatOffsetDate(10),
    endDate: formatOffsetDate(7),
    description: "New Trailer: 'The Faidens'",
    status: "Completed",
    platforms: ["TikTok", "YouTube", "X"],
  },
  {
    id: 4,
    type: ProductionActivityType.CommunityEvent,
    date: formatOffsetDate(1),
    description: "AMA with Lead Designer on Discord",
    status: "In Progress",
    platforms: ["Discord"],
  },
  {
    id: 5,
    type: ProductionActivityType.PRPublication,
    date: formatOffsetDate(12),
    description: "IGN First Look at Crafting System",
    status: "Completed",
    platforms: ["Web"],
  },
  {
    id: 6,
    type: ProductionActivityType.MarketingCampaign,
    date: formatOffsetDate(-3), // upcoming
    startDate: formatOffsetDate(-3),
    endDate: formatOffsetDate(-7),
    description: "Next Wave of CBT Invites",
    status: "Upcoming",
    platforms: ["Web"],
  },
  {
    id: 7,
    type: ProductionActivityType.Release,
    date: formatOffsetDate(0),
    description: "Closed Beta Patch 0.2: Elani Highlands Zone",
    status: "In Progress",
    platforms: ["In-Game"],
  }
];

export const generateMetrics = (activities: ProductionActivity[], days = 90): DailyMetric[] => {
  const metrics: DailyMetric[] = [];
  
  const activityMap = new Map<string, ProductionActivity[]>();
  activities.forEach(a => {
    const dates = [];
    if(a.startDate && a.endDate) {
        let current = new Date(a.startDate);
        const end = new Date(a.endDate);
        while(current <= end) {
            dates.push(formatDate(new Date(current)));
            current.setDate(current.getDate() + 1);
        }
    } else {
        dates.push(a.date);
    }
    dates.forEach(d => {
        if(!activityMap.has(d)) activityMap.set(d, []);
        activityMap.get(d)?.push(a);
    })
  });

  for (let i = days - 1; i >= 0; i--) {
    const date = createDate(i);
    const dateString = formatDate(date);
    
    let dau = 10000 + Math.floor(Math.random() * 500) - 250 + (days-i)*20;
    let revenue = 1500 + Math.floor(Math.random() * 200) - 100 + (days-i)*10;
    let retention = 0.35 + Math.random() * 0.05 - 0.025;
    let negativeComments = 10 + Math.floor(Math.random() * 10);
    let likes = 500 + Math.floor(Math.random() * 200);
    let shares = 50 + Math.floor(Math.random() * 20);
    let reach = 10000 + Math.floor(Math.random() * 2000);

    if (activityMap.has(dateString)) {
      activityMap.get(dateString)?.forEach(activity => {
          switch(activity.type) {
            case ProductionActivityType.Release: dau *= 0.9; negativeComments *= 3; break;
            case ProductionActivityType.Hotfix: dau *= 1.1; negativeComments *= 0.5; break;
            case ProductionActivityType.MarketingCampaign: 
              dau *= 1.2; revenue *= 1.1; likes *= 10; shares *= 12; reach *= 8;
              break;
            case ProductionActivityType.PRPublication:
              likes *= 2; reach *= 1.5; break;
             case ProductionActivityType.CommunityEvent:
              if (activity.description.includes("Stress Test")) {
                  dau *= 1.5; negativeComments *= 1.5; // More players, more issues found
              }
              likes *= 1.2;
              break;
          }
      });
    }

    metrics.push({
      date: dateString,
      dau: Math.max(5000, Math.floor(dau)),
      revenue: Math.max(1000, Math.floor(revenue)),
      retention: parseFloat(Math.max(0.2, Math.min(0.6, retention)).toFixed(2)),
      negativeComments: Math.floor(negativeComments),
      likes: Math.floor(likes),
      shares: Math.floor(shares),
      reach: Math.floor(reach)
    });
  }
  return metrics;
};

const firstNames = ["Aethel", "Kael", "Lyra", "Zane", "Fenris", "Sorin", "Elara", "Jax"];
const lastNames = ["Ironhand", "Swiftblade", "Shadowmend", "Stormcaller", "Voidgazer", "Fireheart"];
const sources = ["YouTube", "X", "Reddit", "TikTok", "Twitch", "Discord"];
const positivePlayerWords = ["hyped for CBT", "love the art style", "fog of war is sick", "Blast Medic feels great", "finally a real MMO", "devs are listening"];
const negativePlayerWords = ["server lag", "Champion is broken", "hate the nerf", "quest is bugged", "game keeps crashing", "another wipe?", "fix this"];
const neutralPlayerWords = ["when is next beta", "need a roadmap", "open beta when", "class balance thoughts", "more keys please"];

const generateCommentText = (sentiment: Sentiment, userType: UserType, activity: ProductionActivity): string => {
    const base = `Re: ${activity.description.substring(0, 20)}... `;
    if (userType === 'Player') {
        switch(sentiment) {
            case "Positive": return `${base} I'm so ${positivePlayerWords[Math.floor(Math.random() * positivePlayerWords.length)]}! Keep it up.`;
            case "Negative": return `${base} The ${negativePlayerWords[Math.floor(Math.random() * negativePlayerWords.length)]} is making the test unplayable.`;
            case "Neutral": return `${base} ${neutralPlayerWords[Math.floor(Math.random() * neutralPlayerWords.length)]}?`;
        }
    } else { // Viewer
         switch(sentiment) {
            case "Positive": return `${base} This looks amazing, I ${positivePlayerWords[Math.floor(Math.random() * positivePlayerWords.length)]}!`;
            case "Negative": return `${base} Not sure about this change, looks clunky.`;
            case "Neutral": return `${base} Interesting. Waiting to see more gameplay.`;
        }
    }
}

const isPlayerComment = (activity: ProductionActivity) => {
    return activity.platforms.includes("In-Game") || activity.platforms.includes("Discord");
}

export const generateComments = (activities: ProductionActivity[]): Comment[] => {
    // Мок данные комментариев теперь генерируются только в ActivityDetailModal
    // Здесь возвращаем пустой массив, чтобы не засорять общий массив allComments
    return [];
};