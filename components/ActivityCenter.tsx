import React, { useMemo } from 'react';
import { ProductionActivity, DailyMetric, Comment } from '../types';
import { getPlatformIcon, getPlatformColor } from '../utils/platformIcons';
import { FaHeart, FaEye, FaComment } from 'react-icons/fa';

interface ActivityCenterProps {
    activities: ProductionActivity[];
    allMetrics: DailyMetric[];
    allComments: Comment[];
    onActivitySelect: (activity: ProductionActivity) => void;
    selectedActivityId: number | null | undefined;
}

const platformColorMap: Record<string, string> = {
    'YouTube': 'bg-red-500/20 text-red-300 border border-red-500/30',
    'TikTok': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    'X': 'bg-black/20 text-gray-300 border border-gray-500/30',
    'Twitter': 'bg-black/20 text-gray-300 border border-gray-500/30', // Поддержка старого названия
    'Twitch': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    'Discord': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    'In-Game': 'bg-green-500/20 text-green-300 border border-green-500/30',
    'Web': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
};

const PlatformTags: React.FC<{ platforms: string[] }> = ({ platforms }) => (
    <div className="flex flex-wrap gap-1.5 mt-2">
        {platforms.map(platform => {
            const colorClass = platformColorMap[platform] || platformColorMap['Web'];
            const icon = getPlatformIcon(platform as any, 'w-3 h-3');
            return (
                <span key={platform} className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${colorClass}`}>
                    {icon}
                    {platform}
                </span>
            );
        })}
    </div>
);

const StatusIndicator: React.FC<{status: ProductionActivity['status']}> = ({status}) => {
    const color = {
        'Completed': 'bg-gray-500',
        'In Progress': 'bg-blue-500 animate-pulse',
        'Upcoming': 'bg-yellow-500',
    }[status];
    return <div className={`w-2 h-2 rounded-full ${color} shrink-0`} title={status}></div>
}

export const ActivityCenter: React.FC<ActivityCenterProps> = ({ activities, allMetrics, allComments, onActivitySelect, selectedActivityId }) => {
    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities]);

    // Вычисляем метрики для каждой активности
    const activitiesWithMetrics = useMemo(() => {
        return sortedActivities.map(activity => {
            // Находим метрики для даты активности и следующих 3 дней
            const activityDate = new Date(activity.date);
            const endDate = new Date(activityDate);
            endDate.setDate(endDate.getDate() + 3);
            
            const relevantMetrics = allMetrics.filter(m => {
                const metricDate = new Date(m.date);
                return metricDate >= activityDate && metricDate <= endDate;
            });

            // Суммируем метрики за период
            const totalLikes = relevantMetrics.reduce((sum, m) => sum + (m.likes || 0), 0);
            const totalReach = relevantMetrics.reduce((sum, m) => sum + (m.reach || 0), 0);
            const totalComments = allComments.filter(c => c.activityId === activity.id).length;

            return {
                ...activity,
                metrics: {
                    likes: totalLikes,
                    reach: totalReach,
                    comments: totalComments
                }
            };
        });
    }, [sortedActivities, allMetrics, allComments]);

    return (
        <div className="glass-card p-4 rounded-xl h-[45.5rem] flex flex-col relative z-[10002]">
            <div className="mb-4 shrink-0">
                <h3 className="text-xl font-semibold text-brand-text-primary mb-3">Activity Feed</h3>
                
                {/* Счетчик активностей */}
                <p className="text-xs text-brand-text-secondary">
                    {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}
                </p>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 -mr-4">
                <div className="space-y-2">
                    {activitiesWithMetrics.length > 0 ? (
                        activitiesWithMetrics.map(activity => (
                            <button
                                key={activity.id}
                                onClick={() => onActivitySelect(activity)}
                                className={`w-full text-left p-2.5 rounded-md transition-all duration-200 border-l-4 ${selectedActivityId === activity.id ? 'bg-brand-primary/20 border-brand-primary' : 'bg-white/5 hover:bg-white/10 border-transparent'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <p className="font-semibold text-sm text-brand-text-primary truncate pr-2">{activity.description}</p>
                                    <StatusIndicator status={activity.status} />
                                </div>
                                <p className="text-xs text-brand-text-secondary mt-1">{new Date(activity.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {activity.type}</p>
                                <PlatformTags platforms={activity.platforms} />
                                
                                {/* Метрики поста */}
                                {activity.metrics && (
                                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/5">
                                        {activity.metrics.likes > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
                                                <FaHeart className="text-pink-400" size={12} />
                                                <span className="font-medium text-brand-text-primary">{activity.metrics.likes.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {activity.metrics.reach > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
                                                <FaEye className="text-blue-400" size={12} />
                                                <span className="font-medium text-brand-text-primary">{activity.metrics.reach.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {activity.metrics.comments > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
                                                <FaComment className="text-green-400" size={12} />
                                                <span className="font-medium text-brand-text-primary">{activity.metrics.comments}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-brand-text-secondary text-sm">
                            <p>No activities</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};