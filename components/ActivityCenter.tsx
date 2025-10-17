import React from 'react';
import { ProductionActivity } from '../types';

interface ActivityCenterProps {
    activities: ProductionActivity[];
    onActivitySelect: (activity: ProductionActivity) => void;
    selectedActivityId: number | null | undefined;
}

const platformColorMap: Record<string, string> = {
    'YouTube': 'bg-red-500/20 text-red-300 border border-red-500/30',
    'TikTok': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    'Twitter': 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    'Twitch': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    'Discord': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    'In-Game': 'bg-green-500/20 text-green-300 border border-green-500/30',
    'Web': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
};

const PlatformTags: React.FC<{ platforms: string[] }> = ({ platforms }) => (
    <div className="flex flex-wrap gap-1.5 mt-2">
        {platforms.map(platform => (
            <span key={platform} className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformColorMap[platform] || platformColorMap['Web']}`}>
                {platform}
            </span>
        ))}
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

export const ActivityCenter: React.FC<ActivityCenterProps> = ({ activities, onActivitySelect, selectedActivityId }) => {
    
    const sortedActivities = [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="glass-card p-4 rounded-xl h-[45.5rem] flex flex-col relative z-10">
            <h3 className="text-3xl font-semibold text-brand-text-primary mb-4 shrink-0">Activity Feed</h3>

            <div className="overflow-y-auto flex-1 pr-2 -mr-4">
                <div className="space-y-2">
                    {sortedActivities.map(activity => (
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
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};