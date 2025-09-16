import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ProductionActivity, DailyMetric, Comment } from '../types';
import { CommentCard } from './CommentCard';

const MetricChangeCard: React.FC<{ title: string; change: number; isNegative?: boolean }> = ({ title, change, isNegative }) => {
    const isPositive = change >= 0;
    const changeColor = (isNegative ? !isPositive : isPositive) ? 'text-green-400' : 'text-red-400';
    const Icon = isPositive 
      ? () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" /></svg>
      : () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.78 5.22a.75.75 0 0 0-1.06 0l-7.22 7.22v-5.69a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 .75.75h7.5a.75.75 0 0 0 0-1.5h-5.69l7.22-7.22a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" /></svg>

    const value = (isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : 'N/A');

    return (
        <div className="bg-black/20 p-3 rounded-lg flex-1">
            <p className="text-sm text-brand-text-secondary">{title}</p>
            <div className={`flex items-center justify-end text-xl font-bold gap-1 ${changeColor}`}>
                <Icon/>
                <span>{value}</span>
            </div>
        </div>
    )
};

interface ActivityDetailModalProps {
    activity: ProductionActivity | null;
    allMetrics: DailyMetric[];
    allComments: Comment[];
    onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, allMetrics, allComments, onClose }) => {
    const modalRoot = document.getElementById('modal-root');

    const analysis = useMemo(() => {
        if (!activity || activity.status === 'Upcoming') return null;

        const metricsByDate = new Map(allMetrics.map(m => [m.date, m]));
        const startDateStr = activity.startDate || activity.date;
        const endDateStr = activity.endDate || activity.date;

        const startMetric = metricsByDate.get(startDateStr);
        
        const endDay = new Date(endDateStr);
        endDay.setDate(endDay.getDate() + 3); // Look at impact over 3 days
        const impactDateStr = endDay.toISOString().split('T')[0];
        const endMetric = metricsByDate.get(impactDateStr) || metricsByDate.get(endDateStr);

        if(!startMetric || !endMetric) return null;
        
        const calculateChange = (start: number, end: number) => {
            if (start === 0) return end > 0 ? Infinity : 0;
            return ((end - start) / start) * 100;
        };
        
        const relevantComments = allComments.filter(c => c.activityId === activity.id);

        return {
            dau: calculateChange(startMetric.dau, endMetric.dau),
            revenue: calculateChange(startMetric.revenue, endMetric.revenue),
            likes: calculateChange(startMetric.likes, endMetric.likes),
            shares: calculateChange(startMetric.shares, endMetric.shares),
            negativeComments: calculateChange(startMetric.negativeComments, endMetric.negativeComments),
            comments: relevantComments,
            positiveComments: relevantComments.filter(c => c.sentiment === 'Positive').slice(0,3),
            negativeCommentsList: relevantComments.filter(c => c.sentiment === 'Negative').slice(0,3),
        }
    }, [activity, allMetrics, allComments]);

    if (!activity || !modalRoot) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div 
                className="glass-card rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/40 animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div>
                        <p className="text-sm text-brand-primary font-bold">{activity.type}</p>
                        <h3 className="text-2xl font-semibold text-brand-text-primary">{activity.description}</h3>
                        <p className="text-sm text-brand-text-secondary">{new Date(activity.date).toDateString()}</p>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {analysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-brand-text-primary mb-3 text-lg">Performance Impact (3-Day)</h4>
                                <div className="space-y-3">
                                    <MetricChangeCard title="DAU" change={analysis.dau} />
                                    <MetricChangeCard title="Revenue" change={analysis.revenue} />
                                    <MetricChangeCard title="Likes" change={analysis.likes} />
                                    <MetricChangeCard title="Shares" change={analysis.shares} />
                                    <MetricChangeCard title="Negative Comments" change={analysis.negativeComments} isNegative />
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-brand-text-primary mb-3 text-lg">Community Reaction</h4>
                                {analysis.negativeCommentsList.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-red-400 mb-2">Top Concerns</h5>
                                        <div className="space-y-2">
                                           {analysis.negativeCommentsList.map(c => <CommentCard key={c.id} comment={c} />)}
                                        </div>
                                    </div>
                                )}
                                 {analysis.positiveComments.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium text-green-400 mb-2">Top Praise</h5>
                                        <div className="space-y-2">
                                           {analysis.positiveComments.map(c => <CommentCard key={c.id} comment={c} />)}
                                        </div>
                                    </div>
                                )}
                                {analysis.comments.length === 0 && <p className="text-sm text-brand-text-secondary">No comments found for this activity.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-brand-text-secondary">
                           <p>Performance data for this activity is not yet available.</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>,
        modalRoot
    );
};