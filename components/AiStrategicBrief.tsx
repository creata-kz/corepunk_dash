import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import type { PlatformFilter } from '../types';

interface AiStrategicBriefProps {
    platformFilter?: PlatformFilter;
}

export const AiStrategicBrief: React.FC<AiStrategicBriefProps> = ({ platformFilter = 'all' }) => {
    const [fullText, setFullText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [briefDate, setBriefDate] = useState<string>('');

    // Загрузка брифа из базы данных
    useEffect(() => {
        const loadBrief = async () => {
            setIsLoading(true);
            try {
                const brief = await supabaseService.getLatestStrategicBrief(platformFilter);

                if (brief) {
                    setFullText(brief.brief_text);
                    setBriefDate(brief.date);
                } else {
                    // Fallback text if no brief in database
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
    }, [platformFilter]);

    return (
        <div
            className="glass-card p-4 rounded-xl text-left w-full h-full flex flex-col"
        >
            <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-xl font-semibold text-brand-text-primary">AI Strategic Brief</h3>
                {briefDate && (
                    <span className="text-xs text-brand-text-secondary">
                        {new Date(briefDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </span>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[170px]">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-brand-text-secondary">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                        <span>Loading brief...</span>
                    </div>
                ) : (
                    <p
                        className="text-sm text-brand-text-secondary leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: fullText }}
                    />
                )}
            </div>
        </div>
    );
};
