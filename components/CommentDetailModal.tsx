import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Comment, Sentiment, UserType } from '../types';
import { CommentCard } from './CommentCard';

type SentimentFilter = Sentiment | "All";
type UserTypeFilter = UserType | "All";
type SortBy = "recent" | "mostLiked" | "mostViewed";

interface CommentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    comments: Comment[];
}

export const CommentDetailModal: React.FC<CommentDetailModalProps> = ({ isOpen, onClose, comments }) => {
    const modalRoot = document.getElementById('modal-root');
    const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("All");
    const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>("All");
    const [sortBy, setSortBy] = useState<SortBy>("recent");

    const filteredAndSortedComments = comments
        .filter(c => {
            const sentimentMatch = sentimentFilter === "All" || c.sentiment === sentimentFilter;
            const userTypeMatch = userTypeFilter === "All" || c.userType === userTypeFilter;
            return sentimentMatch && userTypeMatch;
        })
        .sort((a, b) => {
            if (sortBy === "mostLiked") {
                const aScore = (a.metadata?.score || 0) + (a.metadata?.likes || 0);
                const bScore = (b.metadata?.score || 0) + (b.metadata?.likes || 0);
                return bScore - aScore;
            } else if (sortBy === "mostViewed") {
                const aViews = a.metadata?.views || 0;
                const bViews = b.metadata?.views || 0;
                return bViews - aViews;
            }
            // Default: recent (already sorted by timestamp desc)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .slice(0, 100);

    if (!isOpen || !modalRoot) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
            onClick={onClose}
        >
            <div 
                className="glass-card rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/40 animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h3 className="text-2xl font-semibold text-brand-text-primary">Community Comments</h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-4 shrink-0">
                     <div className="flex flex-col gap-y-3 border-b border-white/10 pb-3">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            <span className="text-sm font-medium text-brand-text-secondary w-20">Sentiment:</span>
                            {(["All", "Positive", "Negative", "Neutral"] as SentimentFilter[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSentimentFilter(f)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        sentimentFilter === f ? 'bg-brand-primary text-white' : 'bg-black/20 hover:bg-black/40 text-brand-text-secondary'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                         <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            <span className="text-sm font-medium text-brand-text-secondary mr-3 w-20">Audience:</span>
                            {(["All", "Player", "Viewer"] as UserTypeFilter[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setUserTypeFilter(f)}
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                        userTypeFilter === f ? 'bg-indigo-600 text-white' : 'bg-black/20 hover:bg-black/40 text-brand-text-secondary'
                                    }`}
                                >
                                    {f}s
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            <span className="text-sm font-medium text-brand-text-secondary w-20">Sort by:</span>
                            <button
                                onClick={() => setSortBy("recent")}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    sortBy === "recent" ? 'bg-teal-600 text-white' : 'bg-black/20 hover:bg-black/40 text-brand-text-secondary'
                                }`}
                            >
                                Recent
                            </button>
                            <button
                                onClick={() => setSortBy("mostLiked")}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    sortBy === "mostLiked" ? 'bg-teal-600 text-white' : 'bg-black/20 hover:bg-black/40 text-brand-text-secondary'
                                }`}
                            >
                                Most Liked
                            </button>
                            <button
                                onClick={() => setSortBy("mostViewed")}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    sortBy === "mostViewed" ? 'bg-teal-600 text-white' : 'bg-black/20 hover:bg-black/40 text-brand-text-secondary'
                                }`}
                            >
                                Most Viewed
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4 pt-0">
                    <div className="space-y-3">
                        {filteredAndSortedComments.length > 0 ? (
                            filteredAndSortedComments.map(comment => <CommentCard key={comment.id} comment={comment}/>)
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-brand-text-secondary">No comments match filters.</p>
                            </div>
                        )}
                    </div>
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