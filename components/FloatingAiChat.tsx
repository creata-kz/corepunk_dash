

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChatMessage, DailyMetric, ProductionActivity, Comment } from '../types';
import { aiService } from '../services/geminiService';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center space-x-1.5">
    <div className="w-2 h-2 rounded-full animate-pulse bg-brand-text-secondary"></div>
    <div className="w-2 h-2 rounded-full animate-pulse bg-brand-text-secondary delay-150"></div>
    <div className="w-2 h-2 rounded-full animate-pulse bg-brand-text-secondary delay-300"></div>
  </div>
);

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
)

const ModelIcon = () => (
    <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/10 p-1">
        <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo-header@2x.webp" alt="Corepunk AI" className="w-full h-full"/>
    </div>
)

interface FloatingAiChatProps {
    isOpen: boolean;
    onClose: () => void;
    initialMessages?: ChatMessage[];
    context: { 
      metrics: DailyMetric[], 
      activities: ProductionActivity[], 
      comments: Comment[] 
    };
}

export const FloatingAiChat: React.FC<FloatingAiChatProps> = ({ isOpen, onClose, initialMessages, context }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        const initialConversation: ChatMessage[] = [
            { role: 'user', text: "What's the current situation?" },
            { 
              role: 'model', 
              text: `Of course. Here's a summary of recent events:<br><br>
- <strong>DAU:</strong> <strong style="color:#F85149;">12,450 (-1.2%)</strong>. This dip is likely due to the recent 'Champion Class Rebalance', as sentiment around it is mixed.<br>
- <strong>Social Shares:</strong> <strong style="color:#238636;">+1200%</strong>. The 'New Trailer' is performing exceptionally well.<br>
- <strong>Top Community Concern:</strong> Players are reporting server lag during peak hours after the stress test.`
            }
        ];
        setMessages(initialMessages || initialConversation);
    }, [isOpen, initialMessages]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setInput('');

        try {
            const aiResponse = await aiService.sendMessage(input, context);
            const modelMessage: ChatMessage = { role: 'model', text: aiResponse };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !modalRoot) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-end justify-end p-4 z-[10000]"
            onClick={onClose}
        >
            <div 
                className="glass-card rounded-xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl shadow-black/50 transform opacity-0 animate-slide-in"
                style={{ animationFillMode: 'forwards', border: '1px solid rgba(139, 148, 158, 0.4)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h3 className="text-2xl font-semibold text-brand-text-primary flex items-center">
                        <ModelIcon/>
                        <span className="ml-2">Context AI Analyst</span>
                    </h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <ModelIcon/>}
                            <div className={`max-w-md p-3 rounded-lg prose prose-invert prose-sm ${msg.role === 'user' ? 'text-white rounded-tr-none bg-user-chat-gradient' : 'bg-black/20 text-brand-text-primary rounded-tl-none'}`} style={{background: msg.role === 'user' ? 'var(--user-chat-gradient)' : ''}}>
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                            </div>
                             {msg.role === 'user' && <UserIcon/>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start items-start gap-3">
                            <ModelIcon/>
                            <div className="max-w-md p-3 rounded-lg bg-black/20 text-brand-text-primary rounded-tl-none">
                                <LoadingSpinner />
                            </div>
                        </div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none placeholder:text-brand-text-secondary/60"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-user-chat-gradient text-white font-bold p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
                            style={{background: 'var(--user-chat-gradient)'}}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateY(2rem);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
            `}</style>
        </div>,
        modalRoot
    );
};