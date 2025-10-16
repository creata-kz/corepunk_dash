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
          });
        }

        const metric = metricsByDate.get(date)!;
        const props = event.properties || {};

        // Считаем посты и комментарии для dailyMentions
        if (event.event_type.includes('post')) {
          metric.posts!++;
        }
        if (event.event_type.includes('comment')) {
          metric.totalComments++;
        }

        // Лайки (из Reddit score, YouTube likes, VK likes)
        if (event.event_type.includes('post') || event.event_type.includes('comment')) {
          if (props.score && props.score > 1) {
            metric.likes += props.score - 1; // Reddit score включает сам пост
          }
          if (props.like_count) {
            metric.likes += props.like_count;
          }
          if (props.likes) {
            metric.likes += props.likes;
          }
        }

        // Value field (Reddit uses this for score)
        if (event.value && event.event_type.includes('post')) {
          metric.likes += Math.max(0, event.value - 1);
        }

        // Reach (views, impressions)
        if (props.view_count) {
          metric.reach += props.view_count;
        }
        if (props.views) {
          metric.reach += props.views;
        }
        if (props.impressions) {
          metric.reach += props.impressions;
        }

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
          } else if (sentiment === 'positive') {
            metric.positiveComments!++;
          } else {
            // Если sentiment нет, анализируем по ключевым словам
            const hasNegative = negativeKeywords.some(word => text.includes(word));
            const hasPositive = positiveKeywords.some(word => text.includes(word));

            if (hasNegative && !hasPositive) {
              metric.negativeComments++;
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
   * Получение событий (постов и комментариев пользователей для Activity Feed)
   */
  public async getActivities(days: number = 90): Promise<ProductionActivity[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Получаем посты и комментарии из всех платформ
      const { data, error } = await this.client
        .from('events')
        .select('*')
        .gte('event_timestamp', startDateStr)
        .or('event_type.like.%post%,event_type.like.%comment%')
        .order('event_timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activities:', error);
        return [];
      }

      return this.transformToActivities(data as SupabaseEvent[]);
    } catch (error) {
      console.error('Error in getActivities:', error);
      return [];
    }
  }

  /**
   * Получение комментариев из событий
   */
  public async getComments(days: number = 90): Promise<Comment[]> {
    if (!this.isConnected() || !this.client) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Получаем комментарии из разных платформ
      const { data, error } = await this.client
        .from('events')
        .select('*')
        .gte('event_timestamp', startDateStr)
        .or('event_type.eq.comment_created,event_type.eq.reddit_comment_mention,event_type.eq.youtube_comment,event_type.eq.vk_comment')
        .order('event_timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return this.transformToComments(data as SupabaseEvent[]);
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

      // Извлекаем автора и анонимизируем
      const author = props.author || props.author_name || props.username || 'Anonymous';
      const anonymizedAuthor = this.anonymizeUsername(author);

      // Извлекаем текст поста или комментария
      const text = props.title ||
                   props.selftext ||
                   props.comment_text ||
                   props.comment_body ||
                   props.text ||
                   'No content';

      // Определяем тип активности
      const isPost = event.event_type.includes('post');
      const activityType = isPost ? 'Post' : 'Comment';

      // Формируем описание: "Username: Preview of text..."
      const textPreview = text.length > 60 ? text.substring(0, 60) + '...' : text;
      const description = `${anonymizedAuthor}: ${textPreview}`;

      return {
        id: index + 1,
        type: ProductionActivityType.CommunityEvent, // Все пользовательский контент = Community Event
        date: event.event_timestamp.split('T')[0],
        description: description,
        status: 'Completed' as const,
        platforms: [this.capitalizeFirstLetter(event.platform)],
      };
    });
  }

  private transformToComments(events: SupabaseEvent[]): Comment[] {
    return events.map((event, index) => {
      const props = event.properties || {};

      // Извлекаем текст из разных полей в зависимости от платформы
      const text = props.comment_text ||
                   props.comment_body ||
                   props.text ||
                   props.message_content ||
                   props.body ||
                   props.content ||
                   'No text';

      // Извлекаем автора
      const author = props.author ||
                     props.author_name ||
                     props.username ||
                     props.user ||
                     'Anonymous';

      return {
        id: index + 1,
        activityId: 0, // Нужно будет связать с activity
        text: text,
        author: author,
        sentiment: this.determineSentiment(props),
        userType: this.determineUserType(event.platform),
        source: this.capitalizeFirstLetter(event.platform),
        timestamp: event.event_timestamp,
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
    const cleanUsername = username.replace(/^(reddit_|youtube_|vk_|discord_)/i, '');

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
    if (str.length <= 3) {
      return str[0] + '*'.repeat(str.length - 1);
    }

    const visibleChars = Math.max(2, Math.floor(str.length * 0.25)); // 25% от длины, минимум 2
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    const middleLength = str.length - (visibleChars * 2);

    return `${start}${'*'.repeat(Math.max(4, middleLength))}${end}`;
  }
}

// Экспортируем singleton instance
export const supabaseService = new SupabaseService();
