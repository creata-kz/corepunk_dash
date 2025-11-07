/**
 * Supabase Service
 * Подключение к реальной базе данных Supabase и получение метрик
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyMetric, ProductionActivity, Comment, Sentiment, UserType, ProductionActivityType } from '../types';

// Интерфейсы для данных из Supabase
interface SupabaseEvent {
  event_id: string;
  event_timestamp: string;
  platform: string;
  event_type: string;
  user_id: string | null;
  content_id: string | null;
  value: number | null;
  properties: Record<string, any>;
  external_event_id: string | null;
}

interface SupabaseSnapshot {
  snapshot_id: string;
  snapshot_date: string;
  snapshot_timestamp: string;
  platform: string;
  metrics: Record<string, any>;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isInitialized = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.isInitialized = true;
        console.log('✅ Supabase client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        this.isInitialized = false;
      }
    } else {
      console.warn('⚠️ Supabase credentials not found. Running in demo mode.');
    }
  }

  /**
   * Проверка подключения к Supabase
   */
  public isConnected(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Получение метрик по дням из базы данных
   * Агрегирует события из таблицы events по дням
   */
  public async getDailyMetrics(days: number = 90): Promise<DailyMetric[]> {
    if (!this.isConnected() || !this.client) {
      console.warn('Supabase not connected, returning empty metrics');
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Запрос для агрегации метрик по дням
      const { data, error } = await this.client.rpc('get_daily_metrics', {
        start_date: startDateStr,
        days_count: days
      });

      if (error) {
        console.error('Error fetching daily metrics:', error);
        return [];
      }

      // Преобразуем данные в формат DailyMetric
      return this.transformToDailyMetrics(data || []);
    } catch (error) {
      console.error('Error in getDailyMetrics:', error);
      return [];
    }
  }

  /**
   * Получение метрик из snapshot таблицы
   * Если snapshots пустые, агрегирует метрики из событий
   */
  public async getSnapshotMetrics(days: number = 90): Promise<DailyMetric[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await this.client
        .from('metric_snapshots')
        .select('*')
        .gte('snapshot_date', startDateStr)
        .order('snapshot_date', { ascending: true });

      if (error) {
        console.error('Error fetching snapshot metrics:', error);
        return this.aggregateMetricsFromEvents(days);
      }

      // Если snapshots есть, используем их
      if (data && data.length > 0) {
        const snapshotMetrics = this.transformSnapshotsToMetrics(data as SupabaseSnapshot[]);

        // Если все метрики нулевые, используем агрегацию из событий
        const hasNonZeroMetrics = snapshotMetrics.some(m =>
          m.dau > 0 || m.revenue > 0 || m.likes > 0 || m.shares > 0 || m.reach > 0
        );

        if (hasNonZeroMetrics) {
          console.log('✅ Using snapshot metrics');
          return snapshotMetrics;
        }
      }

      // Fallback: агрегируем из событий
      console.log('⚠️ Snapshots empty or all zeros, aggregating from events');
      return this.aggregateMetricsFromEvents(days);
    } catch (error) {
      console.error('Error in getSnapshotMetrics:', error);
      return this.aggregateMetricsFromEvents(days);
    }
  }

  /**
   * Агрегирует метрики из событий (events) по дням
   * Используется когда snapshots отсутствуют или пустые
   */
  private async aggregateMetricsFromEvents(days: number): Promise<DailyMetric[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Получаем все события за период
      const { data, error } = await this.client
        .from('events')
        .select('event_timestamp, event_type, platform, value, properties')
        .gte('event_timestamp', startDate.toISOString())
        .order('event_timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching events for aggregation:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No events found for aggregation');
        return [];
      }

      console.log(`📊 Aggregating metrics from ${data.length} events`);

      // Группируем события по датам и агрегируем метрики
      const metricsByDate = new Map<string, DailyMetric>();

      data.forEach((event: any) => {
        const date = event.event_timestamp.split('T')[0];

        if (!metricsByDate.has(date)) {
          metricsByDate.set(date, {
            date,
            dailyMentions: 0,
            engagementScore: 0,
            sentimentPercent: 0,
            likes: 0,
            totalComments: 0,
            reach: 0,
            negativeComments: 0,
            positiveComments: 0,
            posts: 0,
            byPlatform: {},
          });
        }

        const metric = metricsByDate.get(date)!;
        const props = event.properties || {};
        const platform = this.capitalizeFirstLetter(event.platform);

        // Инициализируем платформу если её ещё нет
        if (!metric.byPlatform![platform]) {
          metric.byPlatform![platform] = {
            dailyMentions: 0,
            likes: 0,
            comments: 0,
            reach: 0,
            negativeComments: 0,
          };
        }

        // Считаем посты и комментарии для dailyMentions
        if (event.event_type.includes('post') ||
            event.event_type === 'video_mention' ||
            event.event_type === 'vk_mention') {  // VK posts
          metric.posts!++;
          metric.byPlatform![platform].dailyMentions++;
        }
        if (event.event_type.includes('comment')) {
          metric.totalComments++;
          metric.byPlatform![platform].comments++;
          metric.byPlatform![platform].dailyMentions++;
        }

        // Лайки (из Reddit score, YouTube likes, VK likes, TikTok diggCount)
        let likesForThisEvent = 0;
        if (event.event_type.includes('post') ||
            event.event_type.includes('comment') ||
            event.event_type === 'video_mention' ||
            event.event_type === 'vk_mention') {  // VK posts
          if (props.score && props.score > 1) {
            likesForThisEvent += props.score - 1; // Reddit score включает сам пост
          }
          if (props.like_count) {
            likesForThisEvent += props.like_count;
          }
          if (props.likes) {
            likesForThisEvent += props.likes;
          }
          metric.likes += likesForThisEvent;
          metric.byPlatform![platform].likes += likesForThisEvent;
        }

        // Value field (Reddit uses this for score, TikTok for likes, VK for likes)
        if (event.value && (event.event_type.includes('post') ||
                            event.event_type === 'video_mention' ||
                            event.event_type === 'vk_mention')) {  // VK posts
          let valueAsLikes = 0;
          if (event.event_type === 'video_mention' || event.event_type === 'vk_mention') {
            // TikTok and VK value is already likes count
            valueAsLikes = event.value;
          } else {
            // Reddit score includes the post itself
            valueAsLikes = Math.max(0, event.value - 1);
          }
          metric.likes += valueAsLikes;
          metric.byPlatform![platform].likes += valueAsLikes;
        }

        // Reach (views, impressions)
        let reachForThisEvent = 0;
        if (props.view_count) {
          reachForThisEvent += props.view_count;
        }
        if (props.views) {
          reachForThisEvent += props.views;
        }
        if (props.impressions) {
          reachForThisEvent += props.impressions;
        }
        metric.reach += reachForThisEvent;
        metric.byPlatform![platform].reach += reachForThisEvent;

        // Sentiment analysis для комментариев
        if (event.event_type.includes('comment')) {
          const sentiment = props.sentiment?.toLowerCase();
          const text = (props.comment_text || props.comment_body || props.text || '').toLowerCase();

          // Расширенные списки ключевых слов
          const negativeKeywords = [
            'bad', 'hate', 'worst', 'terrible', 'broken', 'bug', 'trash', 'sucks',
            'awful', 'horrible', 'disappointing', 'disappointed', 'poor', 'useless',
            'waste', 'dead', 'dying', 'fail', 'failed', 'failure', 'boring',
            'stupid', 'dumb', 'lag', 'laggy', 'crash', 'crashes'
          ];

          const positiveKeywords = [
            'love', 'great', 'awesome', 'best', 'good', 'amazing', 'excellent',
            'perfect', 'fantastic', 'wonderful', 'brilliant', 'outstanding',
            'beautiful', 'nice', 'thanks', 'thank', 'appreciate', 'helpful',
            'cool', 'fun', 'enjoy', 'enjoyed', 'favorite', 'impressive'
          ];

          // Проверяем sentiment
          if (sentiment === 'negative') {
            metric.negativeComments++;
            metric.byPlatform![platform].negativeComments++;
          } else if (sentiment === 'positive') {
            metric.positiveComments!++;
          } else {
            // Если sentiment нет, анализируем по ключевым словам
            const hasNegative = negativeKeywords.some(word => text.includes(word));
            const hasPositive = positiveKeywords.some(word => text.includes(word));

            if (hasNegative && !hasPositive) {
              metric.negativeComments++;
              metric.byPlatform![platform].negativeComments++;
            } else if (hasPositive && !hasNegative) {
              metric.positiveComments!++;
            }
          }
        }
      });

      // Финальные расчёты для каждого дня
      metricsByDate.forEach(metric => {
        // Daily Mentions = posts + comments
        metric.dailyMentions = (metric.posts || 0) + metric.totalComments;

        // Engagement Score = (likes × 2) + totalComments + (reach / 100)
        metric.engagementScore = Math.round(
          (metric.likes * 2) +
          metric.totalComments +
          (metric.reach / 100)
        );

        // Sentiment % = (positive / (positive + negative)) × 100
        const totalSentimentComments = (metric.positiveComments || 0) + metric.negativeComments;
        if (totalSentimentComments > 0) {
          metric.sentimentPercent = Math.round(
            ((metric.positiveComments || 0) / totalSentimentComments) * 100
          );
        } else {
          metric.sentimentPercent = 50; // Нейтрально если нет данных
        }
      });

      const metrics = Array.from(metricsByDate.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      console.log(`✅ Aggregated metrics for ${metrics.length} days`);
      console.log(`   Sample day (${metrics[0]?.date}): mentions=${metrics[0]?.dailyMentions}, engagement=${metrics[0]?.engagementScore}, sentiment=${metrics[0]?.sentimentPercent}%`);

      return metrics;
    } catch (error) {
      console.error('Error in aggregateMetricsFromEvents:', error);
      return [];
    }
  }

  /**
   * Получение событий от разработчиков (релизы, хотфиксы, маркетинг)
   * Для Activity Feed - официальные события от команды
   */
  public async getActivities(days: number = 90): Promise<ProductionActivity[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Получаем события от разработчиков
      const { data, error } = await this.client
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
        console.error('Error fetching activities:', error);
        return [];
      }

      // Если нет событий от разработчиков, возвращаем пустой массив
      // (не показываем Activity Feed, пока команда не добавит события)
      return this.transformToActivities(data as SupabaseEvent[]);
    } catch (error) {
      console.error('Error in getActivities:', error);
      return [];
    }
  }

  /**
   * Получение постов и комментариев пользователей для Community Pulse
   * Включает посты и комментарии со всех платформ
   */
  public async getComments(days: number = 90): Promise<Comment[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Получаем ВСЕ посты и комментарии из всех платформ
      // Используем простую фильтрацию - исключаем только официальные события и snapshots
      const { data, error } = await this.client
        .from('events')
        .select('*')
        .gte('event_timestamp', startDateStr)
        .not('event_type', 'in', '(release,hotfix,marketing_campaign,community_event,pr_publication,video_stats_snapshot)')
        .order('event_timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} posts/comments for Community Pulse`);

      if (data && data.length > 0) {
        console.log('Sample event:', {
          type: data[0].event_type,
          platform: data[0].platform,
          author: data[0].properties?.author,
          text: (data[0].properties?.title || data[0].properties?.comment_text || '').substring(0, 50)
        });
      }

      const comments = this.transformToComments(data as SupabaseEvent[]);
      console.log(`📝 Transformed to ${comments.length} comments`);

      if (comments.length > 0) {
        console.log('Sample comment:', {
          author: comments[0].author,
          text: comments[0].text.substring(0, 50),
          sentiment: comments[0].sentiment,
          source: comments[0].source
        });
      }

      return comments;
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  }

  /**
   * Получение статистики платформ
   */
  public async getPlatformStats(): Promise<Record<string, any>> {
    if (!this.isConnected() || !this.client) {
      return {};
    }

    try {
      const { data, error } = await this.client
        .from('events')
        .select('platform, event_type')
        .limit(1000);

      if (error) {
        console.error('Error fetching platform stats:', error);
        return {};
      }

      // Агрегируем статистику
      const stats: Record<string, any> = {};
      (data || []).forEach((event: any) => {
        if (!stats[event.platform]) {
          stats[event.platform] = { total: 0, types: {} };
        }
        stats[event.platform].total++;
        stats[event.platform].types[event.event_type] =
          (stats[event.platform].types[event.event_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getPlatformStats:', error);
      return {};
    }
  }

  // ==========================================
  // ПРИВАТНЫЕ МЕТОДЫ ТРАНСФОРМАЦИИ ДАННЫХ
  // ==========================================

  private transformToDailyMetrics(data: any[]): DailyMetric[] {
    return data.map((item: any) => ({
      date: item.date,
      dau: item.dau || 0,
      revenue: item.revenue || 0,
      retention: item.retention || 0,
      negativeComments: item.negative_comments || 0,
      likes: item.likes || 0,
      shares: item.shares || 0,
      reach: item.reach || 0,
    }));
  }

  private transformSnapshotsToMetrics(snapshots: SupabaseSnapshot[]): DailyMetric[] {
    const metricsMap = new Map<string, DailyMetric>();

    snapshots.forEach(snapshot => {
      const date = snapshot.snapshot_date;

      if (!metricsMap.has(date)) {
        metricsMap.set(date, {
          date,
          dau: 0,
          revenue: 0,
          retention: 0,
          negativeComments: 0,
          likes: 0,
          shares: 0,
          reach: 0,
        });
      }

      const metric = metricsMap.get(date)!;
      const m = snapshot.metrics;

      // Суммируем метрики из разных платформ
      metric.likes += m.likes || m.like_count || 0;
      metric.shares += m.shares || m.retweets || m.reposts || 0;
      metric.reach += m.reach || m.views || m.view_count || 0;

      // DAU и revenue берем из игровой статистики если есть
      if (snapshot.platform === 'game') {
        metric.dau = m.dau || metric.dau;
        metric.revenue = m.revenue || metric.revenue;
        metric.retention = m.retention || metric.retention;
      }
    });

    return Array.from(metricsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  private transformToActivities(events: SupabaseEvent[]): ProductionActivity[] {
    return events.map((event, index) => {
      const props = event.properties || {};

      return {
        id: index + 1,
        type: this.mapEventTypeToActivityType(event.event_type),
        date: event.event_timestamp.split('T')[0],
        startDate: props.start_date,
        endDate: props.end_date,
        description: props.description || props.title || event.event_type,
        status: this.determineActivityStatus(event.event_timestamp, props),
        platforms: props.platforms || [event.platform],
      };
    });
  }

  private transformToComments(events: SupabaseEvent[]): Comment[] {
    return events.map((event, index) => {
      const props = event.properties || {};

      // Извлекаем текст из разных полей (посты и комментарии)
      const text = props.title ||  // Reddit post title
                   props.selftext ||  // Reddit post text
                   props.description ||  // TikTok video description
                   props.comment_text ||
                   props.comment_body ||
                   props.text ||
                   props.message_content ||
                   props.body ||
                   props.content ||
                   'No text';

      // Извлекаем автора
      const rawAuthor = props.author ||
                        props.author_name ||
                        props.username ||
                        props.user ||
                        'Anonymous';

      // Анонимизируем username
      const anonymizedAuthor = this.anonymizeUsername(rawAuthor);

      // Извлекаем метрики для определения "важности"
      const score = props.score || event.value || 0;
      const likes = props.like_count || props.likes || 0;
      const views = props.view_count || props.views || 0;

      // Определяем, это пост или комментарий
      const isPost = event.event_type.includes('post') ||
                     event.event_type === 'video_mention' ||
                     event.event_type === 'vk_mention';  // VK posts

      // Определяем post_id в зависимости от платформы и типа события
      let postId: string | undefined;
      if (isPost) {
        // Для постов используем их собственный ID
        if (event.event_type === 'vk_mention') {
          // VK posts: используем content_id для совпадения с комментариями
          postId = event.content_id;
        } else {
          postId = props.post_id || props.video_id || event.content_id || event.external_event_id;
        }
      } else {
        // Для комментариев используем ID родительского поста
        postId = props.post_id || props.video_id;
      }

      return {
        id: index + 1,
        activityId: 0, // Не привязываем к activity
        text: text,
        author: anonymizedAuthor,  // Используем анонимизированное имя
        sentiment: this.determineSentiment(props),
        userType: this.determineUserType(event.platform),
        source: this.capitalizeFirstLetter(event.platform),
        timestamp: event.event_timestamp,
        // Добавляем метрики для сортировки
        metadata: {
          score,
          likes,
          views,
          url: props.url || props.permalink,
          is_post: isPost,
          post_id: postId,
          post_title: props.post_title || (isPost ? text : null),
          video_urls: props.video_urls || [],
        }
      };
    });
  }

  private mapEventTypeToActivityType(eventType: string): ProductionActivityType {
    const mapping: Record<string, ProductionActivityType> = {
      'release': ProductionActivityType.Release,
      'hotfix': ProductionActivityType.Hotfix,
      'marketing_campaign': ProductionActivityType.MarketingCampaign,
      'community_event': ProductionActivityType.CommunityEvent,
      'pr_publication': ProductionActivityType.PRPublication,
    };

    return mapping[eventType] || ProductionActivityType.CommunityEvent;
  }

  private determineActivityStatus(timestamp: string, props: any): "Upcoming" | "In Progress" | "Completed" {
    const eventDate = new Date(timestamp);
    const now = new Date();

    if (eventDate > now) return "Upcoming";
    if (props.status === 'in_progress') return "In Progress";
    return "Completed";
  }

  private determineSentiment(props: any): Sentiment {
    if (props.sentiment) {
      const s = props.sentiment.toLowerCase();
      if (s === 'positive') return 'Positive';
      if (s === 'negative') return 'Negative';
      if (s === 'neutral') return 'Neutral';
    }

    // Простой анализ по ключевым словам из всех возможных текстовых полей
    const text = (
      props.text ||
      props.comment_text ||
      props.comment_body ||
      props.message_content ||
      props.body ||
      ''
    ).toLowerCase();

    // Расширенный список негативных слов
    const negativeWords = [
      'bad', 'hate', 'worst', 'terrible', 'broken', 'bug', 'trash', 'sucks',
      'awful', 'horrible', 'disappointing', 'disappointed', 'poor', 'shit',
      'useless', 'waste', 'dead', 'dying', 'fail', 'failed', 'failure',
      'never', 'boring', 'stupid', 'dumb', 'lag', 'laggy', 'crash', 'crashes'
    ];

    // Расширенный список позитивных слов
    const positiveWords = [
      'love', 'great', 'awesome', 'best', 'good', 'amazing', 'excellent',
      'perfect', 'fantastic', 'wonderful', 'brilliant', 'outstanding',
      'beautiful', 'nice', 'thanks', 'thank', 'appreciate', 'helpful',
      'cool', 'fun', 'enjoy', 'enjoyed', 'favorite', 'impressive'
    ];

    const hasNegative = negativeWords.some(word => text.includes(word));
    const hasPositive = positiveWords.some(word => text.includes(word));

    // Приоритет негативу (для лучшего отслеживания проблем)
    if (hasNegative) return 'Negative';
    if (hasPositive) return 'Positive';

    return 'Neutral';
  }

  private determineUserType(platform: string): UserType {
    // Игроки - те, кто в Discord или в игре
    if (platform === 'discord' || platform === 'game') {
      return 'Player';
    }
    return 'Viewer';
  }

  private capitalizeFirstLetter(str: string): string {
    // Special handling for platform names to match PlatformFilter type
    const platformMap: Record<string, string> = {
      'tiktok': 'Tiktok',
      'reddit': 'Reddit',
      'youtube': 'Youtube',
      'instagram': 'Instagram',
      'twitter': 'Twitter',
      'vk': 'Vk',
      'discord': 'Discord',
    };

    const lowerStr = str.toLowerCase();
    if (platformMap[lowerStr]) {
      return platformMap[lowerStr];
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Анонимизирует username, заменяя середину звездочками
   * Примеры:
   *   Teigun@gmail.com → Te****n@gmail.com
   *   JohnDoe123 → Jo*****23
   *   Bob → B*b
   */
  private anonymizeUsername(username: string): string {
    if (!username || username === 'Anonymous' || username === '[deleted]') {
      return 'Anonymous';
    }

    // Удаляем префиксы типа "reddit_" или "youtube_"
    const cleanUsername = username.replace(/^(reddit_|youtube_|vk_|discord_|tiktok_)/i, '');

    if (cleanUsername.length <= 3) {
      // Для коротких имён показываем первую и последнюю букву
      return cleanUsername[0] + '*' + (cleanUsername.length > 1 ? cleanUsername[cleanUsername.length - 1] : '');
    }

    // Для email адресов
    if (cleanUsername.includes('@')) {
      const [localPart, domain] = cleanUsername.split('@');
      const anonymizedLocal = this.anonymizeString(localPart);
      return `${anonymizedLocal}@${domain}`;
    }

    // Для обычных username
    return this.anonymizeString(cleanUsername);
  }

  /**
   * Анонимизирует строку, оставляя начало и конец
   */
  private anonymizeString(str: string): string {
    // Обработка пустой строки или очень коротких строк
    if (!str || str.length === 0) {
      return 'Anonymous';
    }

    if (str.length === 1) {
      return '*';
    }

    if (str.length === 2) {
      return str[0] + '*';
    }

    if (str.length === 3) {
      return str[0] + '*' + str[2];
    }

    // Для строк длиннее 3 символов
    const visibleChars = Math.max(2, Math.floor(str.length * 0.25)); // 25% от длины, минимум 2
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    const middleLength = str.length - (visibleChars * 2);

    return `${start}${'*'.repeat(Math.max(4, middleLength))}${end}`;
  }

  /**
   * Получение стратегического брифа за указанную дату
   * @param date - дата в формате YYYY-MM-DD (по умолчанию сегодня)
   * @param platformFilter - фильтр платформы ('all', 'Reddit', и т.д.)
   */
  public async getStrategicBrief(date?: string, platformFilter: string = 'all'): Promise<{
    brief_text: string;
    date: string;
    metrics_summary: any;
    created_at: string;
  } | null> {
    if (!this.isConnected() || !this.client) {
      return null;
    }

    try {
      const queryDate = date || new Date().toISOString().split('T')[0];

      console.log(`📄 Fetching strategic brief for ${queryDate}, platform: ${platformFilter}`);

      const { data, error } = await this.client
        .from('strategic_briefs')
        .select('*')
        .eq('date', queryDate)
        .eq('platform_filter', platformFilter)
        .single();

      if (error) {
        console.warn(`No brief found for ${queryDate}:`, error.message);
        return null;
      }

      console.log(`✅ Brief found for ${queryDate}`);
      return data;
    } catch (error) {
      console.error('Error fetching strategic brief:', error);
      return null;
    }
  }

  /**
   * Получение последнего доступного брифа
   * @param platformFilter - фильтр платформы
   */
  public async getLatestStrategicBrief(platformFilter: string = 'all'): Promise<{
    brief_text: string;
    date: string;
    metrics_summary: any;
    created_at: string;
  } | null> {
    if (!this.isConnected() || !this.client) {
      return null;
    }

    try {
      console.log(`📄 Fetching latest strategic brief, platform: ${platformFilter}`);

      const { data, error } = await this.client
        .from('strategic_briefs')
        .select('*')
        .eq('platform_filter', platformFilter)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('No briefs found:', error.message);
        return null;
      }

      console.log(`✅ Latest brief found: ${data.date}`);
      return data;
    } catch (error) {
      console.error('Error fetching latest brief:', error);
      return null;
    }
  }
}

// Экспортируем singleton instance
export const supabaseService = new SupabaseService();
