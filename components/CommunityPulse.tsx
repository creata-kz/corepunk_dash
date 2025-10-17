

import React, { useMemo, useState, useEffect } from 'react';
import { Comment, PostWithComments } from '../types';
import { PostWithCommentsModal } from './PostWithCommentsModal';
import { AllPostsModal } from './AllPostsModal';

interface CommunityPulseProps {
    comments: Comment[];
    onOpenModal: () => void;
}

export const CommunityPulse: React.FC<CommunityPulseProps> = ({ comments, onOpenModal }) => {
    const [selectedPost, setSelectedPost] = useState<PostWithComments | null>(null);
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [displayScore, setDisplayScore] = useState(0);

    const { sentimentScore, overall } = useMemo(() => {
        const counts = { Positive: 0, Negative: 0, Neutral: 0 };
        comments.forEach(c => {
            counts[c.sentiment]++;
        });
        const total = counts.Positive + counts.Negative;
        if (total === 0) return { sentimentScore: 50, overall: 'Neutral' };

        const score = Math.round((counts.Positive / total) * 100);
        
        let overallStatus: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
        if (score > 60) {
            overallStatus = 'Positive';
        } else if (score < 40) {
            overallStatus = 'Negative';
        }

        return { sentimentScore: score, overall: overallStatus };
    }, [comments]);

    useEffect(() => {
        // Animate the score on mount and when it changes
        const timer = setTimeout(() => {
            setDisplayScore(sentimentScore);
        }, 100); // Small delay to allow initial render
        return () => clearTimeout(timer);
    }, [sentimentScore]);

    // Группируем комментарии по постам
    const postsWithComments = useMemo(() => {
        const postsMap = new Map<string, Comment>();
        const commentsByPostId = new Map<string, Comment[]>();

        // Сначала собираем все посты и комментарии
        comments.forEach(item => {
            if (item.metadata?.is_post && item.metadata?.post_id) {
                // Это пост - используем его post_id как ключ
                postsMap.set(item.metadata.post_id, item);
            } else if (!item.metadata?.is_post && item.metadata?.post_id) {
                // Это комментарий - группируем по post_id
                const postId = item.metadata.post_id;
                if (!commentsByPostId.has(postId)) {
                    commentsByPostId.set(postId, []);
                }
                commentsByPostId.get(postId)!.push(item);
            }
        });

        // Создаем PostWithComments для каждого поста
        const result: PostWithComments[] = Array.from(postsMap.entries()).map(([postId, post]) => {
            const postComments = commentsByPostId.get(postId) || [];

            return {
                post,
                comments: postComments,
                totalComments: postComments.length
            };
        });

        // Сортируем по важности (score + количество комментариев)
        return result.sort((a, b) => {
            const aScore = (a.post.metadata?.score || 0) + (a.totalComments * 5);
            const bScore = (b.post.metadata?.score || 0) + (b.totalComments * 5);
            return bScore - aScore;
        });
    }, [comments]);

    // Топ посты для показа
    const topPosts = useMemo(() => {
        return postsWithComments.slice(0, 2);
    }, [postsWithComments]);
    
    const overallSentimentStyles = {
        Positive: 'text-teal-400',
        Negative: 'text-red-400',
        Neutral: 'text-gray-400',
    }

    return (
        <div className="glass-card p-4 rounded-xl h-full flex flex-col justify-between">
            <div>
                <h3 className="text-3xl font-semibold text-brand-text-primary mb-2">Community Pulse</h3>
                
                 <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm text-brand-text-secondary">Overall Sentiment</p>
                        <p className={`text-lg font-bold ${overallSentimentStyles[overall]}`}>{overall}</p>
                    </div>
                    <div className="relative w-full pt-2">
                        <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-brand-primary to-teal-400" />
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-brand-bg shadow-lg"
                            style={{ 
                                left: `calc(${displayScore}% - 10px)`,
                                transition: 'left 1s cubic-bezier(0.25, 1, 0.5, 1)',
                            }}
                        >
                           <div className="w-full h-full rounded-full border-2 border-brand-bg"/>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-brand-text-secondary mb-2">Top Posts</h4>
                    <div className="space-y-2">
                        {topPosts.length > 0 ? topPosts.map(postData => (
                            <div
                                key={postData.post.id}
                                onClick={() => setSelectedPost(postData)}
                                className="bg-white/5 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                        postData.post.source === 'Reddit' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                        postData.post.source === 'Youtube' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        postData.post.source === 'Tiktok' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                        {postData.post.source}
                                    </span>
                                    <span className="text-xs text-brand-text-secondary">{postData.totalComments} comments</span>
                                </div>
                                <p className="text-sm text-brand-text-primary font-medium line-clamp-2">{postData.post.text}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-brand-text-secondary">
                                    <span>{postData.post.author}</span>
                                    {postData.post.metadata?.score && <span>↑ {postData.post.metadata.score}</span>}
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-brand-text-secondary text-center py-4">No posts available.</p>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowAllPosts(true)}
                className="w-full mt-3 bg-white/5 hover:bg-white/10 text-brand-text-primary font-bold py-2 px-4 rounded-md transition-colors duration-200"
            >
                View All Posts
            </button>

            {/* Modal for individual post with comments */}
            <PostWithCommentsModal
                isOpen={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                postData={selectedPost}
            />

            {/* Modal for all posts list */}
            <AllPostsModal
                isOpen={showAllPosts}
                onClose={() => setShowAllPosts(false)}
                posts={postsWithComments}
            />
        </div>
    );
};