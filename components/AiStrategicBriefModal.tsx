import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabaseService } from '../services/supabaseService';
import type { PlatformFilter } from '../types';

interface AiStrategicBriefModalProps {
    isOpen: boolean;
    onClose: () => void;
    platformFilter: PlatformFilter;
    onRead: () => void;
}

export const AiStrategicBriefModal: React.FC<AiStrategicBriefModalProps> = ({ 
    isOpen, 
    onClose, 
    platformFilter,
    onRead 
}) => {
    const modalRoot = document.getElementById('modal-root');
    const [fullText, setFullText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [briefDate, setBriefDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            const loadBrief = async () => {
                setIsLoading(true);
                try {
                    const brief = await supabaseService.getLatestStrategicBrief(platformFilter);

                    if (brief) {
                        setFullText(brief.brief_text);
                        setBriefDate(brief.date);
                    } else {
                        setFullText(`Strategic brief has not been generated yet. <br/><br/>Run the script <span class="font-mono text-brand-primary">generate_strategic_brief.py</span> to create a brief based on current metrics and community activity.`);
                        setBriefDate('');
                    }
                } catch (error) {
                    console.error('Error loading brief:', error);
                    setFullText('Error loading strategic brief.');
                } finally {
                    setIsLoading(false);
                }
            };

            loadBrief();
            // Отмечаем как прочитанный при открытии
            onRead();
        }
    }, [isOpen, platformFilter, onRead]);

    if (!isOpen || !modalRoot) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
            onClick={onClose}
        >
            <div 
                className="glass-card rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/40 animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/30">
                            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brand-text-primary">AI Strategic Brief</h2>
                            {briefDate && (
                                <p className="text-xs text-brand-text-secondary mt-0.5">
                                    {new Date(briefDate).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-brand-text-secondary py-12">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                            <span>Loading brief...</span>
                        </div>
                    ) : (
                        <div 
                            className="text-sm text-brand-text-secondary leading-relaxed prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: fullText }}
                        />
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

