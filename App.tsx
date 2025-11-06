
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DailyMetric, ProductionActivity, Comment, ChatMessage, DateRange, CustomDateRange, PlatformFilter } from './types';
import { generateInitialActivities, generateMetrics, generateComments } from './services/mockDataService';
import { supabaseService } from './services/supabaseService';
import { SparklineCard } from './components/SparklineCard';
import { TimelineChart } from './components/TimelineChart';
import { SocialEngagementChart } from './components/SocialEngagementChart';
import { CommunityPulse } from './components/CommunityPulse';
import { Header } from './components/Header';
import { FloatingAiChat } from './components/FloatingAiChat';
import { ActivityCenter } from './components/ActivityCenter';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { AiStrategicBrief } from './components/AiStrategicBrief';
import { CommentDetailModal } from './components/CommentDetailModal';
import { MetricDetailModal } from './components/MetricDetailModal';
import { METRIC_DESCRIPTIONS } from './constants/metricDescriptions';


const App: React.FC = () => {
  // Raw Data State
  const [allActivities, setAllActivities] = useState<ProductionActivity[]>([]);
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);

  // Loading & Error State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'supabase'>('mock');

  // Control State
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ProductionActivity | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Metric Detail Modal State
  const [selectedMetric, setSelectedMetric] = useState<{
    key: keyof DailyMetric;
    title: string;
    strokeColor: string;
    changeType?: 'positive' | 'negative';
  } | null>(null);

  // Debug: log date range changes
  useEffect(() => {
    console.log(`⏰ App: dateRange changed to "${dateRange}"`, customDateRange ? `with custom range: ${customDateRange.startDate} to ${customDateRange.endDate}` : '');
  }, [dateRange, customDateRange]);

  // Load mock data fallback
  const useMockData = useCallback(() => {
    console.log('📦 Loading mock data...');
    const initialActivities = generateInitialActivities();
    const initialMetrics = generateMetrics(initialActivities, 90);
    const initialComments = generateComments(initialActivities);

    setAllActivities(initialActivities);
    setAllMetrics(initialMetrics);
    setAllComments(initialComments);
    setDataSource('mock');
  }, []);

  // Load data from Supabase or fallback to mock
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Supabase is connected
      if (supabaseService.isConnected()) {
        console.log('📡 Loading data from Supabase...');

        // Load data in parallel
        const [metrics, activities, comments] = await Promise.all([
          supabaseService.getSnapshotMetrics(90),
          supabaseService.getActivities(90),
          supabaseService.getComments(90)
        ]);

        // Check if we have any data
        if (metrics.length > 0 || activities.length > 0 || comments.length > 0) {
          setAllMetrics(metrics);
          setAllActivities(activities);
          setAllComments(comments);
          setDataSource('supabase');
          console.log('✅ Supabase data loaded:', {
            metrics: metrics.length,
            activities: activities.length,
            comments: comments.length
          });
          if (metrics.length > 0) {
            console.log(`   Metrics date range: ${metrics[0].date} to ${metrics[metrics.length - 1].date}`);
            console.log(`   Sample metrics:`, metrics.slice(0, 3).map(m => ({
              date: m.date,
              dailyMentions: m.dailyMentions,
              likes: m.likes,
              reach: m.reach
            })));
          }
        } else {
          // Database is empty, use mock data
          console.warn('⚠️ Supabase database is empty, using mock data');
          useMockData();
        }
      } else {
        // Supabase not configured, use mock data
        console.warn('⚠️ Supabase not configured, using mock data');
        useMockData();
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback to mock data on error
      useMockData();
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  // Refresh data manually
  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const parallaxFactor = 0.5;
      const offset = window.pageYOffset;
      document.documentElement.style.backgroundPositionY = `${offset * parallaxFactor}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-refresh every 5 minutes (only for Supabase data)
  useEffect(() => {
    if (dataSource === 'supabase' && !isLoading) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadData();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [dataSource, isLoading, loadData]);

  // Filter data by date range and platform
  const { activities, metrics, comments } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    let startStr: string;
    let endStr: string = todayStr;

    // Determine date range
    if (dateRange === 'today') {
      // Show only today's data
      startStr = todayStr;
    } else if (dateRange === 'all') {
      // Show all available data (no date filtering)
      startStr = '';
      endStr = '';
    } else if (dateRange === 'custom' && customDateRange) {
      // Use custom date range
      startStr = customDateRange.startDate;
      endStr = customDateRange.endDate;
    } else {
      // Fallback to "all" if custom is selected but no range is set
      startStr = '';
      endStr = '';
    }

    // Filter data by date range
    let filteredMetrics = dateRange === 'all'
      ? allMetrics
      : allMetrics.filter(m => m.date >= startStr && m.date <= endStr);
    let filteredActivities = dateRange === 'all'
      ? allActivities
      : allActivities.filter(a => a.date >= startStr && a.date <= endStr);
    let filteredComments = dateRange === 'all'
      ? allComments
      : allComments.filter(c => {
          const commentDate = c.timestamp.split('T')[0];
          return commentDate >= startStr && commentDate <= endStr;
        });

    // Filter by platform
    if (platformFilter !== 'all') {
      // Filter metrics - recalculate from platform breakdown
      filteredMetrics = filteredMetrics.map(m => {
        const platformData = m.byPlatform?.[platformFilter];
        if (!platformData) {
          // No data for this platform on this date
          return {
            ...m,
            dailyMentions: 0,
            likes: 0,
            totalComments: 0,
            reach: 0,
            negativeComments: 0,
            engagementScore: 0,
            sentimentPercent: 50,
          };
        }

        // Calculate engagement score for platform
        const engagementScore = Math.round(
          (platformData.likes || 0) * 1.5 +
          (platformData.comments || 0) * 2 +
          (platformData.reach || 0) * 0.1
        );

        // Calculate sentiment from platform data
        const totalComments = platformData.comments || 0;
        const negativeComments = platformData.negativeComments || 0;
        const positiveComments = Math.max(0, totalComments - negativeComments);
        const sentimentPercent = totalComments > 0
          ? Math.round((positiveComments / totalComments) * 100)
          : 50;

        return {
          ...m,
          dailyMentions: platformData.dailyMentions || 0,
          likes: platformData.likes || 0,
          totalComments: platformData.comments || 0,
          reach: platformData.reach || 0,
          negativeComments: platformData.negativeComments || 0,
          engagementScore: engagementScore,
          sentimentPercent: sentimentPercent,
        };
      });

      // Filter comments by platform (source field)
      filteredComments = filteredComments.filter(c => c.source === platformFilter);

      // Filter activities by platform
      filteredActivities = filteredActivities.filter(a =>
        a.platforms.includes(platformFilter) || a.platforms.length === 0
      );
    }

    console.log(`📅 Filter: ${dateRange}${dateRange !== 'all' ? ` (${startStr} to ${endStr})` : ''}, Platform: ${platformFilter}`);
    console.log(`   Metrics: ${filteredMetrics.length}, Activities: ${filteredActivities.length}, Comments: ${filteredComments.length}`);
    if (filteredMetrics.length > 0) {
      const latest = filteredMetrics[filteredMetrics.length - 1];
      console.log(`   Latest: ${latest.date} - mentions:${latest.dailyMentions}, engagement:${latest.engagementScore}, likes:${latest.likes}, reach:${latest.reach}`);
    }

    return { metrics: filteredMetrics, activities: filteredActivities, comments: filteredComments };
  }, [dateRange, customDateRange, platformFilter, allMetrics, allActivities, allComments]);

  const handleSelectActivity = (activity: ProductionActivity) => {
    setSelectedActivity(activity.id === selectedActivity?.id ? null : activity);
  }

  const handleCloseActivityModal = () => {
    setSelectedActivity(null);
  }

  // Aggregate metrics for the selected period
  const aggregatedMetrics = useMemo(() => {
    if (metrics.length === 0) return null;

    // Sum all metrics for the period
    const totals = metrics.reduce((acc, m) => ({
      dailyMentions: acc.dailyMentions + m.dailyMentions,
      engagementScore: acc.engagementScore + m.engagementScore,
      sentimentPercent: acc.sentimentPercent + m.sentimentPercent,
      likes: acc.likes + m.likes,
      totalComments: acc.totalComments + m.totalComments,
      reach: acc.reach + m.reach,
      negativeComments: acc.negativeComments + m.negativeComments,
      positiveComments: acc.positiveComments + (m.positiveComments || Math.max(0, m.totalComments - m.negativeComments)),
    }), {
      dailyMentions: 0,
      engagementScore: 0,
      sentimentPercent: 0,
      likes: 0,
      totalComments: 0,
      reach: 0,
      negativeComments: 0,
      positiveComments: 0,
    });

    // Calculate average sentiment
    totals.sentimentPercent = Math.round(totals.sentimentPercent / metrics.length);

    // Calculate average mentions per day
    const avgMentionsPerDay = Math.round(totals.dailyMentions / metrics.length);

    // Calculate engagement rate (engagement from reach)
    const engagementRate = totals.reach > 0 ? ((totals.engagementScore / totals.reach) * 100).toFixed(2) : '0';

    // Find top platform by total mentions
    const platformTotals: Record<string, number> = {};
    metrics.forEach(m => {
      if (m.byPlatform) {
        Object.entries(m.byPlatform).forEach(([platform, data]) => {
          platformTotals[platform] = (platformTotals[platform] || 0) + data.dailyMentions;
        });
      }
    });
    const topPlatform = Object.entries(platformTotals).sort((a, b) => b[1] - a[1])[0];

    console.log(`📊 Aggregated metrics for ${metrics.length} days:`, totals);
    return {
      ...totals,
      avgMentionsPerDay,
      engagementRate: parseFloat(engagementRate),
      topPlatform: topPlatform ? topPlatform[0] : 'N/A',
      topPlatformMentions: topPlatform ? topPlatform[1] : 0,
    };
  }, [metrics]);

  // Get last two periods for comparison (for change percentage)
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const prevMetric = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const calculateChange = (current: number, previous: number | undefined): number => {
    if (previous === undefined || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-text-primary text-lg font-semibold">Loading Analytics...</p>
          <p className="text-brand-text-secondary text-sm mt-2">Fetching data from {supabaseService.isConnected() ? 'Supabase' : 'demo mode'}</p>
        </div>
      </div>
    );
  }

  // Error state (with retry)
  if (error && dataSource !== 'mock') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Data</h2>
          <p className="text-brand-text-secondary mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-screen-2xl mx-auto">
          <Header
            dateRange={dateRange}
            setDateRange={setDateRange}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            platformFilter={platformFilter}
            setPlatformFilter={setPlatformFilter}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />

          <main>
            {/* Performance Overview Header with Data Source Indicator */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-brand-text-primary">Performance Overview</h2>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                  dataSource === 'supabase'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${dataSource === 'supabase' ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
                  <span>Source: {dataSource === 'supabase' ? 'Supabase (Live)' : 'Demo Data'}</span>
                </div>
                {metrics.length > 0 && (
                  <div className="text-xs text-brand-text-secondary">
                    {metrics.length} days of data
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-6">
              <SparklineCard
                title="Daily Mentions"
                value={aggregatedMetrics?.dailyMentions.toLocaleString() || 'N/A'}
                change={calculateChange(latestMetric?.dailyMentions || 0, prevMetric?.dailyMentions)}
                data={metrics.map(m => ({ v: m.dailyMentions }))}
                dataKey="v"
                strokeColor="#388BFD"
                fullMetrics={metrics}
                metricKey="dailyMentions"
                description={METRIC_DESCRIPTIONS.dailyMentions}
                onClick={() => setSelectedMetric({ key: 'dailyMentions', title: 'Daily Mentions', strokeColor: '#388BFD' })}
              />
              <SparklineCard
                title="Engagement Rate"
                value={`${aggregatedMetrics?.engagementRate.toFixed(2) || '0'}%`}
                change={calculateChange(
                  latestMetric && latestMetric.reach > 0 ? (latestMetric.engagementScore / latestMetric.reach) * 100 : 0,
                  prevMetric && prevMetric.reach > 0 ? (prevMetric.engagementScore / prevMetric.reach) * 100 : 0
                )}
                data={metrics.map(m => ({ v: m.reach > 0 ? (m.engagementScore / m.reach) * 100 : 0 }))}
                dataKey="v"
                strokeColor="#1F883D"
                fullMetrics={metrics}
                metricKey="engagementScore"
                description={METRIC_DESCRIPTIONS.engagementRate}
                onClick={() => setSelectedMetric({ key: 'engagementScore', title: 'Engagement Rate', strokeColor: '#1F883D' })}
              />
              <SparklineCard
                title="Likes"
                value={aggregatedMetrics?.likes.toLocaleString() || 'N/A'}
                change={calculateChange(latestMetric?.likes || 0, prevMetric?.likes)}
                data={metrics.map(m => ({ v: m.likes }))}
                dataKey="v"
                strokeColor="#DB61A2"
                fullMetrics={metrics}
                metricKey="likes"
                description={METRIC_DESCRIPTIONS.likes}
                onClick={() => setSelectedMetric({ key: 'likes', title: 'Likes', strokeColor: '#DB61A2' })}
              />
              <SparklineCard
                title="Positive Comments"
                value={aggregatedMetrics?.positiveComments.toLocaleString() || 'N/A'}
                change={calculateChange(
                  (latestMetric?.positiveComments || (latestMetric ? Math.max(0, latestMetric.totalComments - latestMetric.negativeComments) : 0)),
                  (prevMetric?.positiveComments || (prevMetric ? Math.max(0, prevMetric.totalComments - prevMetric.negativeComments) : 0))
                )}
                data={metrics.map(m => ({ v: m.positiveComments || Math.max(0, m.totalComments - m.negativeComments) }))}
                dataKey="v"
                strokeColor="#10B981"
                fullMetrics={metrics}
                metricKey="totalComments"
                description={METRIC_DESCRIPTIONS.positiveComments}
                onClick={() => setSelectedMetric({ key: 'totalComments', title: 'Positive Comments', strokeColor: '#10B981' })}
              />
              <SparklineCard
                title="Avg. Mentions/Day"
                value={aggregatedMetrics?.avgMentionsPerDay.toLocaleString() || 'N/A'}
                change={calculateChange(
                  latestMetric?.dailyMentions || 0,
                  prevMetric?.dailyMentions || 0
                )}
                data={metrics.map(m => ({ v: m.dailyMentions }))}
                dataKey="v"
                strokeColor="#F0883E"
                fullMetrics={metrics}
                metricKey="dailyMentions"
                description={METRIC_DESCRIPTIONS.avgMentionsPerDay}
                onClick={() => setSelectedMetric({ key: 'dailyMentions', title: 'Avg. Mentions/Day', strokeColor: '#F0883E' })}
              />
              <SparklineCard
                title="Reach"
                value={aggregatedMetrics?.reach.toLocaleString() || 'N/A'}
                change={calculateChange(latestMetric?.reach || 0, prevMetric?.reach)}
                data={metrics.map(m => ({ v: m.reach }))}
                dataKey="v"
                strokeColor="#9333EA"
                fullMetrics={metrics}
                metricKey="reach"
                description={METRIC_DESCRIPTIONS.reach}
                onClick={() => setSelectedMetric({ key: 'reach', title: 'Reach', strokeColor: '#9333EA' })}
              />
              <SparklineCard
                title="Sentiment"
                value={`${aggregatedMetrics?.sentimentPercent || 50}%`}
                change={calculateChange(latestMetric?.sentimentPercent || 50, prevMetric?.sentimentPercent || 50)}
                data={metrics.map(m => ({ v: m.sentimentPercent }))}
                dataKey="v"
                strokeColor="#3BBDD0"
                fullMetrics={metrics}
                metricKey="sentimentPercent"
                description={METRIC_DESCRIPTIONS.sentimentPercent}
                onClick={() => setSelectedMetric({ key: 'sentimentPercent', title: 'Sentiment', strokeColor: '#3BBDD0' })}
              />
              <SparklineCard
                title="Negative Comments"
                value={aggregatedMetrics?.negativeComments.toLocaleString() || 'N/A'}
                change={calculateChange(latestMetric?.negativeComments || 0, prevMetric?.negativeComments)}
                changeType="negative"
                data={metrics.map(m => ({ v: m.negativeComments }))}
                dataKey="v"
                strokeColor="#F85149"
                fullMetrics={metrics}
                metricKey="negativeComments"
                description={METRIC_DESCRIPTIONS.negativeComments}
                onClick={() => setSelectedMetric({ key: 'negativeComments', title: 'Negative Comments', strokeColor: '#F85149', changeType: 'negative' })}
              />
            </div>

            <div className="grid grid-cols-12 gap-6 mb-6">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <TimelineChart metrics={metrics} activities={activities} highlightedActivity={selectedActivity} />
                <SocialEngagementChart metrics={metrics} activities={activities} highlightedActivity={selectedActivity} />
              </div>

              <div className="col-span-12 lg:col-span-4">
                <ActivityCenter
                    activities={activities}
                    onActivitySelect={handleSelectActivity}
                    selectedActivityId={selectedActivity?.id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <AiStrategicBrief platformFilter={platformFilter} />
               <CommunityPulse
                    comments={comments}
                    onOpenModal={() => setIsCommentModalOpen(true)}
                />
            </div>
          </main>
        </div>
      </div>

      <button
        onClick={() => setIsChatOpen(true)}
        title="Discuss with AI"
        aria-label="Open AI Chat"
        className="bg-brand-primary fixed bottom-6 right-6 hover:bg-brand-secondary text-white rounded-full p-2 shadow-lg shadow-brand-primary/20 transform hover:scale-110 transition-transform duration-200 z-40 animate-pulse-glow"
      >
        <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo-header@2x.webp" alt="AI Chat" className="w-12 h-12"/>
      </button>

      <FloatingAiChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={{ metrics, activities, comments }}
      />

      <ActivityDetailModal
        activity={selectedActivity}
        allMetrics={allMetrics}
        allComments={allComments}
        onClose={handleCloseActivityModal}
      />

      <CommentDetailModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        comments={comments}
      />

      {selectedMetric && (
        <MetricDetailModal
          isOpen={selectedMetric !== null}
          onClose={() => setSelectedMetric(null)}
          metricKey={selectedMetric.key}
          title={selectedMetric.title}
          description={METRIC_DESCRIPTIONS[selectedMetric.key]}
          metrics={metrics}
          strokeColor={selectedMetric.strokeColor}
          currentValue={selectedMetric.key === 'sentimentPercent'
            ? `${aggregatedMetrics?.[selectedMetric.key] || 50}%`
            : aggregatedMetrics?.[selectedMetric.key]?.toLocaleString() || 'N/A'
          }
          change={calculateChange(
            latestMetric?.[selectedMetric.key] || (selectedMetric.key === 'sentimentPercent' ? 50 : 0),
            prevMetric?.[selectedMetric.key] || (selectedMetric.key === 'sentimentPercent' ? 50 : undefined)
          )}
          changeType={selectedMetric.changeType}
        />
      )}
    </>
  );
};

export default App;
