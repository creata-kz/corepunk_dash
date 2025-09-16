

import React, { useState, useEffect, useMemo } from 'react';
import { DailyMetric, ProductionActivity, Comment, ChatMessage, DateRange } from './types';
import { generateInitialActivities, generateMetrics, generateComments } from './services/mockDataService';
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


const App: React.FC = () => {
  // Raw Data State
  const [allActivities, setAllActivities] = useState<ProductionActivity[]>([]);
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);

  // Control State
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ProductionActivity | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  useEffect(() => {
    const initialActivities = generateInitialActivities();
    const initialMetrics = generateMetrics(initialActivities, 90);
    const initialComments = generateComments(initialActivities);
    
    setAllActivities(initialActivities);
    setAllMetrics(initialMetrics);
    setAllComments(initialComments);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const parallaxFactor = 0.5;
      const offset = window.pageYOffset;
      document.documentElement.style.backgroundPositionY = `${offset * parallaxFactor}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { activities, metrics, comments } = useMemo(() => {
    const rangeMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = rangeMap[dateRange];
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const startStr = startDate.toISOString().split('T')[0];

    const filteredMetrics = allMetrics.filter(m => m.date >= startStr);
    const filteredActivities = allActivities.filter(a => a.date >= startStr);
    
    const activityIds = new Set(filteredActivities.map(a => a.id));
    const filteredComments = allComments.filter(c => activityIds.has(c.activityId));

    return { metrics: filteredMetrics, activities: filteredActivities, comments: filteredComments };
  }, [dateRange, allMetrics, allActivities, allComments]);
  
  const handleSelectActivity = (activity: ProductionActivity) => {
    setSelectedActivity(activity.id === selectedActivity?.id ? null : activity);
  }

  const handleCloseActivityModal = () => {
    setSelectedActivity(null);
  }
  
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const prevMetric = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const calculateChange = (current: number, previous: number | undefined): number => {
    if (previous === undefined || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-screen-2xl mx-auto">
          <Header dateRange={dateRange} setDateRange={setDateRange} />

          <main>
            <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-6">
              <SparklineCard title="DAU" value={latestMetric?.dau.toLocaleString() || 'N/A'} change={calculateChange(latestMetric?.dau || 0, prevMetric?.dau)} data={metrics.map(m => ({ v: m.dau }))} dataKey="v" strokeColor="#388BFD" />
              <SparklineCard title="Revenue" value={`$${latestMetric?.revenue.toLocaleString() || 'N/A'}`} change={calculateChange(latestMetric?.revenue || 0, prevMetric?.revenue)} data={metrics.map(m => ({ v: m.revenue }))} dataKey="v" strokeColor="#1F883D" />
              <SparklineCard title="Likes" value={latestMetric?.likes.toLocaleString() || 'N/A'} change={calculateChange(latestMetric?.likes || 0, prevMetric?.likes)} data={metrics.map(m => ({ v: m.likes }))} dataKey="v" strokeColor="#DB61A2" />
              <SparklineCard title="Shares" value={latestMetric?.shares.toLocaleString() || 'N/A'} change={calculateChange(latestMetric?.shares || 0, prevMetric?.shares)} data={metrics.map(m => ({ v: m.shares }))} dataKey="v" strokeColor="#A371F7" />
              <SparklineCard title="Reach" value={latestMetric?.reach.toLocaleString() || 'N/A'} change={calculateChange(latestMetric?.reach || 0, prevMetric?.reach)} data={metrics.map(m => ({ v: m.reach }))} dataKey="v" strokeColor="#F0883E" />
              <SparklineCard title="Retention" value={`${((latestMetric?.retention || 0) * 100).toFixed(1)}%`} change={calculateChange(latestMetric?.retention || 0, prevMetric?.retention)} data={metrics.map(m => ({ v: m.retention }))} dataKey="v" strokeColor="#3BBDD0" />
              <SparklineCard title="Negative Comments" value={latestMetric?.negativeComments.toLocaleString() || 'N/A'} change={calculateChange(latestMetric?.negativeComments || 0, prevMetric?.negativeComments)} changeType="negative" data={metrics.map(m => ({ v: m.negativeComments }))} dataKey="v" strokeColor="#F85149" />
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
               <AiStrategicBrief />
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
    </>
  );
};

export default App;