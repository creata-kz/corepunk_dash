import React, { useState, useMemo, useEffect } from 'react';
import { PostWithComments, Sentiment, PlatformFilter } from '../types';
import { PostWithCommentsModal } from './PostWithCommentsModal';
import { getPlatformIcon, getPlatformColor } from '../utils/platformIcons';

interface AllPostsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    posts: PostWithComments[];
}

type SentimentFilter = 'all' | Sentiment;
type SortOption = 'recent' | 'comments' | 'score';

export const AllPostsSidebar: React.FC<AllPostsSidebarProps> = ({ isOpen, onClose, posts }) => {
    const [selectedPost, setSelectedPost] = useState<PostWithComments | null>(null);
    const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
    const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [headerHeight, setHeaderHeight] = useState(96); // Default fallback

    useEffect(() => {
        const updateHeaderHeight = () => {
            const header = document.querySelector('header');
            if (header) {
                const height = header.offsetHeight;
                setHeaderHeight(height);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        window.addEventListener('scroll', updateHeaderHeight);
        
        // Watch for header changes
        const header = document.querySelector('header');
        if (header) {
            const observer = new MutationObserver(updateHeaderHeight);
            observer.observe(header, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            return () => {
                observer.disconnect();
                window.removeEventListener('resize', updateHeaderHeight);
                window.removeEventListener('scroll', updateHeaderHeight);
            };
        }
        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            window.removeEventListener('scroll', updateHeaderHeight);
        };
    }, []);

    // Filter and sort posts
    const filteredAndSortedPosts = useMemo(() => {
        let filtered = posts;

        // Filter by platform
        if (platformFilter !== 'all') {
            filtered = filtered.filter(p => p.post.source === platformFilter);
        }

        // Filter by sentiment
        if (sentimentFilter !== 'all') {
            filtered = filtered.filter(p => p.post.sentiment === sentimentFilter);
        }

        // Sort
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'comments':
                    return b.totalComments - a.totalComments;
                case 'score':
                    return (b.post.metadata?.score || 0) - (a.post.metadata?.score || 0);
                case 'recent':
                default:
                    return new Date(b.post.timestamp).getTime() - new Date(a.post.timestamp).getTime();
            }
        });

        return sorted;
    }, [posts, platformFilter, sentimentFilter, sortBy]);

    return (
        <>
            {/* Backdrop with smooth fade */}
            <div 
                className={`fixed inset-0 z-[19999] bg-black/60 transition-opacity duration-500 ease-in-out ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />
            
            {/* Sidebar */}
            <div 
                className={`fixed right-0 w-full max-w-2xl bg-brand-surface border-l border-brand-border shadow-2xl z-[20000] transform transition-transform duration-500 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                } ${!isOpen ? 'pointer-events-none' : ''}`}
                style={{
                    top: `${headerHeight}px`,
                    height: `calc(100vh - ${headerHeight}px)`
                }}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-brand-border shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-brand-text-primary">All Posts</h2>
                            <button
                                onClick={onClose}
                                className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Filters Section */}
                        <div className="space-y-3">
                            {/* Platform Filter */}
                            <div>
                                <label className="text-xs font-medium text-brand-text-secondary mb-2 block">Platform</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'Reddit', 'Youtube', 'Instagram', 'X', 'Tiktok', 'Vk', 'Discord'] as const).map(platform => (
                                        <button
                                            key={platform}
                                            onClick={() => setPlatformFilter(platform)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                                                platformFilter === platform
                                                    ? 'bg-brand-primary text-white'
                                                    : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                                            }`}
                                        >
                                            {getPlatformIcon(platform, 'w-3 h-3')}
                                            <span>{platform === 'all' ? 'All' : platform}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sentiment Filter */}
                            <div>
                                <label className="text-xs font-medium text-brand-text-secondary mb-2 block">Sentiment</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSentimentFilter('all')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sentimentFilter === 'all'
                                                ? 'bg-brand-primary text-white'
                                                : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setSentimentFilter('Positive')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sentimentFilter === 'Positive'
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-white/5 text-teal-400 hover:bg-white/10'
                                        }`}
                                    >
                                        😊 Positive
                                    </button>
                                    <button
                                        onClick={() => setSentimentFilter('Neutral')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sentimentFilter === 'Neutral'
                                                ? 'bg-gray-500 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                    >
                                        😐 Neutral
                                    </button>
                                    <button
                                        onClick={() => setSentimentFilter('Negative')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sentimentFilter === 'Negative'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/5 text-red-400 hover:bg-white/10'
                                        }`}
                                    >
                                        😟 Negative
                                    </button>
                                </div>
                            </div>

                            {/* Sort Options */}
                            <div>
                                <label className="text-xs font-medium text-brand-text-secondary mb-2 block">Sort by</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSortBy('recent')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sortBy === 'recent'
                                                ? 'bg-brand-primary text-white'
                                                : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                                        }`}
                                    >
                                        Recent
                                    </button>
                                    <button
                                        onClick={() => setSortBy('comments')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sortBy === 'comments'
                                                ? 'bg-brand-primary text-white'
                                                : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                                        }`}
                                    >
                                        Most Comments
                                    </button>
                                    <button
                                        onClick={() => setSortBy('score')}
                                        className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            sortBy === 'score'
                                                ? 'bg-brand-primary text-white'
                                                : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                                        }`}
                                    >
                                        Highest Score
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-3 text-sm text-brand-text-secondary">
                            Showing {filteredAndSortedPosts.length} of {posts.length} posts
                        </div>
                        {filteredAndSortedPosts.length > 0 ? (
                            <div className="space-y-3">
                                {filteredAndSortedPosts.map((postData) => (
                                    <div
                                        key={postData.post.id}
                                        onClick={() => setSelectedPost(postData)}
                                        className="bg-white/5 p-4 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-brand-primary/30"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${getPlatformColor(postData.post.source)}`}>
                                                {getPlatformIcon(postData.post.source, 'w-3 h-3')}
                                                {postData.post.source}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                                postData.post.sentiment === 'Positive' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' :
                                                postData.post.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                            }`}>
                                                {postData.post.sentiment === 'Positive' ? '😊' : postData.post.sentiment === 'Negative' ? '😟' : '😐'} {postData.post.sentiment}
                                            </span>
                                            <span className="text-xs text-brand-text-secondary">
                                                {new Date(postData.post.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-brand-text-secondary">
                                                {postData.totalComments} comments
                                            </span>
                                        </div>
                                        <p className="text-base text-brand-text-primary font-medium mb-2 line-clamp-2">
                                            {postData.post.text}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-brand-text-secondary">
                                            <span>By {postData.post.author}</span>
                                            {postData.post.metadata?.score && <span>↑ {postData.post.metadata.score} upvotes</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-brand-text-secondary text-center py-8">No posts available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* PostWithCommentsModal - opens when clicking a post */}
            <PostWithCommentsModal
                isOpen={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                postData={selectedPost}
            />
        </>
    );
};

