import React, { useState } from 'react';
import { PostWithComments } from '../types';
import { PostWithCommentsModal } from './PostWithCommentsModal';

interface AllPostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    posts: PostWithComments[];
}

export const AllPostsModal: React.FC<AllPostsModalProps> = ({ isOpen, onClose, posts }) => {
    const [selectedPost, setSelectedPost] = useState<PostWithComments | null>(null);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-4xl my-8 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-6 border-b border-brand-border flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-brand-text-primary">All Posts</h2>
                        <button
                            onClick={onClose}
                            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Posts List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {posts.length > 0 ? (
                            <div className="space-y-3">
                                {posts.map((postData) => (
                                    <div
                                        key={postData.post.id}
                                        onClick={() => setSelectedPost(postData)}
                                        className="bg-white/5 p-4 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-brand-primary/30"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                                postData.post.source === 'Reddit' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                postData.post.source === 'Youtube' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                postData.post.source === 'Tiktok' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                            }`}>
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
