import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createPortal } from 'react-dom';
import { ProductionActivity, DailyMetric, Comment, Sentiment } from '../types';
import { CommentCard } from './CommentCard';
import { getPlatformIcon } from '../utils/platformIcons';
import { aiService } from '../services/geminiService';
import { FaEye, FaHeart, FaComment, FaShare, FaChartBar, FaRobot, FaCheckCircle, FaTimesCircle, FaMinusCircle, FaHandsHelping } from 'react-icons/fa';
import { HiHashtag } from 'react-icons/hi2';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const ArrowUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
    </svg>
);

const ArrowDownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-9.293l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
    </svg>
);

// Карточка метрики точь-в-точь как в Performance Overview
const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    change: number; 
    isNegative?: boolean;
    strokeColor: string;
    data: any[];
    dataKey: string;
    fullMetrics?: DailyMetric[];
    metricKey?: keyof DailyMetric;
}> = ({ title, value, change, isNegative, strokeColor, data, dataKey, fullMetrics, metricKey }) => {
    const [showPlatformTooltip, setShowPlatformTooltip] = useState(false);
    const platformButtonRef = useRef<HTMLButtonElement>(null);
    const [platformTooltipPosition, setPlatformTooltipPosition] = useState({ top: 0, left: 0 });
    
    const isPositive = change >= 0;
    const changeColor = (isNegative ? !isPositive : isPositive) ? 'text-green-400' : 'text-red-400';

    // Добавляем локальные индексы к данным
    const last7DaysData = data.slice(-7).map((item, idx) => ({
        ...item,
        index: idx
    }));

    // Расчет топ платформ по вкладу в метрику
    const platformBreakdown = useMemo(() => {
        if (!fullMetrics || !metricKey || fullMetrics.length === 0) return null;

        const platformTotals: Record<string, number> = {};
        let totalValue = 0;

        if (metricKey === 'engagementScore') {
            fullMetrics.forEach(metric => {
                if (metric.byPlatform) {
                    Object.entries(metric.byPlatform).forEach(([platform, data]) => {
                        const platformData = data as DailyMetric['byPlatform'][string];
                        const engagement = Math.round(
                            (platformData.likes || 0) * 1.5 +
                            (platformData.comments || 0) * 2 +
                            (platformData.reach || 0) * 0.1
                        );
                        platformTotals[platform] = (platformTotals[platform] || 0) + engagement;
                        totalValue += engagement;
                    });
                }
            });
        } else {
            const metricKeyMap: Record<string, keyof DailyMetric['byPlatform'][string] | undefined> = {
                'dailyMentions': 'dailyMentions',
                'likes': 'likes',
                'totalComments': 'comments',
                'reach': 'reach',
                'negativeComments': 'negativeComments',
            };

            const platformKey = metricKeyMap[metricKey as string];
            if (!platformKey) return null;

            fullMetrics.forEach(metric => {
                if (metric.byPlatform) {
                    Object.entries(metric.byPlatform).forEach(([platform, data]) => {
                        const val = data[platformKey] || 0;
                        platformTotals[platform] = (platformTotals[platform] || 0) + val;
                        totalValue += val;
                    });
                }
            });
        }

        if (totalValue === 0) return null;

        const sorted = Object.entries(platformTotals)
            .map(([platform, value]) => {
                const rawPercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const percentage = rawPercentage < 1 ? Math.round(rawPercentage * 10) / 10 : Math.round(rawPercentage);
                return { platform, value, percentage };
            })
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value);

        return sorted.length > 0 ? sorted : null;
    }, [fullMetrics, metricKey]);

    const platformStyles: Record<string, { icon: React.ReactNode; color: string }> = {
        'Reddit': { icon: getPlatformIcon('Reddit', 'w-2.5 h-2.5'), color: 'text-orange-400' },
        'Youtube': { icon: getPlatformIcon('Youtube', 'w-2.5 h-2.5'), color: 'text-red-400' },
        'Tiktok': { icon: getPlatformIcon('Tiktok', 'w-2.5 h-2.5'), color: 'text-pink-400' },
        'Vk': { icon: getPlatformIcon('Vk', 'w-2.5 h-2.5'), color: 'text-blue-400' },
        'Discord': { icon: getPlatformIcon('Discord', 'w-2.5 h-2.5'), color: 'text-indigo-400' },
        'X': { icon: getPlatformIcon('X', 'w-2.5 h-2.5'), color: 'text-gray-300' },
        'Twitter': { icon: getPlatformIcon('X', 'w-2.5 h-2.5'), color: 'text-gray-300' },
        'Instagram': { icon: getPlatformIcon('Instagram', 'w-2.5 h-2.5'), color: 'text-purple-400' },
    };
    
    // Функция для получения иконки метрики
    const getMetricIcon = () => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('mention')) {
            return <div className="text-brand-text-secondary flex items-center"><HiHashtag size={16} /></div>;
        }
        if (titleLower.includes('engagement')) {
            return <div className="text-brand-text-secondary flex items-center"><FaHandsHelping size={16} /></div>;
        }
        if (titleLower.includes('like')) {
            return <div className="text-brand-text-secondary flex items-center"><FaHeart size={16} /></div>;
        }
        if (titleLower.includes('reach')) {
            return <div className="text-brand-text-secondary flex items-center"><FaEye size={16} /></div>;
        }
        return null;
    };

    const metricIcon = getMetricIcon();
    
    return (
        <div className="glass-card p-4 rounded-xl flex flex-col h-40 relative overflow-visible">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-brand-text-secondary text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        {metricIcon}
                        {title}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5 mb-1.5">
                        <p className="text-2xl font-semibold text-brand-text-primary">{value}</p>
                        <div className={`flex items-center text-xs font-medium ${changeColor} whitespace-nowrap`}>
                            {isPositive ? <ArrowUpIcon/> : <ArrowDownIcon/>}
                            <span>{Math.abs(change).toFixed(1)}%</span>
                        </div>
                    </div>

                    {platformBreakdown && (
                        <div className="relative">
                            <button
                                ref={platformButtonRef}
                                onMouseEnter={() => {
                                    if (platformButtonRef.current) {
                                        const rect = platformButtonRef.current.getBoundingClientRect();
                                        setPlatformTooltipPosition({ top: rect.bottom + 4, left: rect.left });
                                        setShowPlatformTooltip(true);
                                    }
                                }}
                                onMouseLeave={() => setShowPlatformTooltip(false)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (platformButtonRef.current) {
                                        const rect = platformButtonRef.current.getBoundingClientRect();
                                        setPlatformTooltipPosition({ top: rect.bottom + 4, left: rect.left });
                                        setShowPlatformTooltip(!showPlatformTooltip);
                                    }
                                }}
                                className="text-[9px] text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center gap-1 px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded"
                            >
                                <FaChartBar size={8} />
                                <span>By Platform</span>
                            </button>
                            
                            {showPlatformTooltip && typeof window !== 'undefined' && createPortal(
                                <div 
                                    className="fixed bg-brand-surface border border-brand-border rounded-lg p-2 shadow-xl text-xs min-w-[140px]"
                                    style={{ 
                                        zIndex: 999999,
                                        top: `${platformTooltipPosition.top}px`,
                                        left: `${platformTooltipPosition.left}px`
                                    }}
                                    onMouseEnter={() => setShowPlatformTooltip(true)}
                                    onMouseLeave={() => setShowPlatformTooltip(false)}
                                >
                                    <p className="text-brand-text-secondary text-[10px] mb-1.5 uppercase tracking-wide">Platform Breakdown:</p>
                                    <div className="flex flex-col gap-1">
                                        {platformBreakdown.map(({ platform, percentage }) => {
                                            const style = platformStyles[platform] || { icon: getPlatformIcon(platform as any, 'w-3 h-3') || <FaChartBar size={12} />, color: 'text-gray-400' };
                                            const formattedPercentage = percentage < 1 ? percentage.toFixed(1) : percentage.toString();
                                            return (
                                                <div key={platform} className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1 text-brand-text-secondary">
                                                        {style.icon}
                                                        <span className="text-[10px]">{platform}</span>
                                                    </span>
                                                    <span className={`text-xs font-semibold ${style.color}`}>{formattedPercentage}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last7DaysData}>
                        <Tooltip
                            cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '5 5' }}
                            wrapperStyle={{ zIndex: 999999, pointerEvents: 'none', position: 'fixed' }}
                        />
                        <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

interface ActivityDetailModalProps {
    activity: ProductionActivity | null;
    allMetrics: DailyMetric[];
    allComments: Comment[];
    onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, allMetrics, allComments, onClose }) => {
    const modalRoot = document.getElementById('modal-root');
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [impactDays, setImpactDays] = useState<number>(1); // Выбор диапазона измерения
    const [campaignGoal, setCampaignGoal] = useState<string>(''); // Цель кампании
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [selectedCommentCategory, setSelectedCommentCategory] = useState<'all' | 'Positive' | 'Negative' | 'Neutral'>('all'); // Выбранная категория комментариев
    const [panelWidth, setPanelWidth] = useState<number>(0);
    const [activityFeedRight, setActivityFeedRight] = useState<number>(0);
    const [activityFeedLeft, setActivityFeedLeft] = useState<number>(0);
    const [metricsVersion, setMetricsVersion] = useState<number>(0); // Триггер для пересчета метрик

    // Используем useRef для хранения стабильной версии метрик, чтобы не пересчитывать при каждом обновлении
    const metricsRef = useRef<{ length: number; lastUpdate: number; metrics: DailyMetric[] }>({ 
        length: 0, 
        lastUpdate: 0, 
        metrics: [] 
    });
    
    // Используем useRef для хранения реальных комментариев, чтобы не пересчитывать при каждом изменении allComments
    const commentsRef = useRef<{ activityId: number | null; comments: Comment[] }>({ activityId: null, comments: [] });

    // Обновляем metricsRef когда allMetrics изменяются
    useEffect(() => {
        if (allMetrics && allMetrics.length > 0) {
            metricsRef.current = {
                length: allMetrics.length,
                lastUpdate: Date.now(),
                metrics: allMetrics
            };
            // Триггерим пересчет анализа
            setMetricsVersion(prev => prev + 1);
        }
    }, [allMetrics]);

    // Сбрасываем состояние при закрытии/открытии модала
    useEffect(() => {
        if (!activity) {
            setAiInsight('');
            setIsLoadingAi(false);
            setImpactDays(1);
            setCampaignGoal('');
            setSelectedCommentCategory('all');
            setShouldAnimate(false);
            setMetricsVersion(0);
            // Сбрасываем ref метрик при закрытии
            metricsRef.current = { length: 0, lastUpdate: 0, metrics: [] };
            commentsRef.current = { activityId: null, comments: [] };
        } else {
            // При открытии модала заполняем metricsRef
            if (allMetrics && allMetrics.length > 0) {
                metricsRef.current = {
                    length: allMetrics.length,
                    lastUpdate: Date.now(),
                    metrics: allMetrics
                };
                // Триггерим пересчет анализа
                setMetricsVersion(prev => prev + 1);
            }
        }
    }, [activity, allMetrics]);

    // Вычисляем ширину панели на основе позиции Community Pulse
    useEffect(() => {
        if (!activity) return;

        const calculatePanelWidth = () => {
            // Ищем элемент Community Pulse через его родительский контейнер с col-span-8
            // Или ищем по структуре: grid > div.col-span-8
            const gridContainer = document.querySelector('.grid.grid-cols-12');
            if (gridContainer) {
                const communityPulseContainer = gridContainer.querySelector('.col-span-12.lg\\:col-span-8') as HTMLElement;
                const activityFeedContainer = gridContainer.querySelector('.col-span-12.lg\\:col-span-4') as HTMLElement;
                
                if (communityPulseContainer) {
                    const rect = communityPulseContainer.getBoundingClientRect();
                    // Ширина панели = позиция правого края Community Pulse контейнера
                    setPanelWidth(rect.right);
                }
                
                if (activityFeedContainer) {
                    const rect = activityFeedContainer.getBoundingClientRect();
                    // Позиция левого и правого края Activity Feed
                    setActivityFeedLeft(rect.left);
                    setActivityFeedRight(rect.right);
                }
                
                if (communityPulseContainer && activityFeedContainer) {
                    return;
                }
            }
            
            // Fallback: используем расчет на основе viewport
            // Community Pulse занимает 8/12 = 66.67%, но нужно учесть контейнер и padding
            const sidebarWidth = 80; // ml-20 = 5rem = 80px
            const containerPadding = 32; // px-8 на lg = 2rem = 32px
            const maxContainerWidth = 1536; // max-w-screen-2xl
            const viewportWidth = window.innerWidth;
            const containerWidth = Math.min(viewportWidth - sidebarWidth - containerPadding * 2, maxContainerWidth);
            const communityPulseWidth = (containerWidth / 12) * 8; // 8 колонок из 12
            const gap = 24; // gap-6 = 1.5rem = 24px
            setPanelWidth(sidebarWidth + containerPadding + communityPulseWidth + gap / 2);
            const activityFeedLeft = sidebarWidth + containerPadding + communityPulseWidth + gap;
            const activityFeedWidth = (containerWidth / 12) * 4; // 4 колонки из 12
            setActivityFeedLeft(activityFeedLeft);
            setActivityFeedRight(activityFeedLeft + activityFeedWidth);
        };

        // Небольшая задержка для того, чтобы DOM успел отрендериться
        const timer = setTimeout(calculatePanelWidth, 100);
        window.addEventListener('resize', calculatePanelWidth);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculatePanelWidth);
        };
    }, [activity]);

    // Управляем анимацией появления
    useEffect(() => {
        if (activity) {
            // Небольшая задержка для плавной анимации
            requestAnimationFrame(() => {
                setShouldAnimate(true);
            });
        } else {
            setShouldAnimate(false);
        }
    }, [activity?.id]);

    // Обработка клавиши ESC для закрытия
    useEffect(() => {
        if (!activity) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [activity, onClose]);
    
    // Генерируем мок данные для комментариев если их нет (используем ref для стабильности)
    const commentsWithMock = useMemo(() => {
        if (!activity) return [];
        
        // Проверяем реальные комментарии из allComments напрямую
        const existingComments = allComments.filter(c => c.activityId === activity.id);
        
        // Если есть реальные комментарии, используем их
        if (existingComments.length > 0) {
            return existingComments;
        }
        
        // Иначе генерируем мок данные (только один раз при открытии модала)
        const mockComments: Comment[] = [];
        const sources = ['Reddit', 'X', 'Youtube', 'Instagram', 'Tiktok', 'Discord'];
        const positiveTexts = [
            'Great update! Really enjoying the new features.',
            'This is exactly what we needed. Thank you!',
            'Amazing work, keep it up!',
            'Love the changes, game feels much better now.',
            'Best update so far, really impressed!'
        ];
        const negativeTexts = [
            'Not a fan of this change, feels unbalanced.',
            'This broke my favorite feature.',
            'Why did you change this? It was fine before.',
            'Disappointed with this update.',
            'This needs to be reverted ASAP.'
        ];
        const neutralTexts = [
            'Interesting change, will need to test it.',
            'Not sure how I feel about this yet.',
            'Time will tell if this is good or bad.',
            'Need more information about this.',
            'Will wait and see how this plays out.'
        ];
        
        const sentiments: Sentiment[] = ['Positive', 'Negative', 'Neutral'];
        const userTypes: ('Player' | 'Viewer')[] = ['Player', 'Viewer'];
        
        // Используем фиксированный seed для детерминированности
        const seed = activity.id * 1000;
        
        // Создаем мок пост
        const postDate = new Date(activity.date);
        const postPlatform = activity.platforms[0] || 'X';
        mockComments.push({
            id: 10000 + activity.id * 1000,
            activityId: activity.id,
            text: activity.description,
            author: 'Corepunk Team',
            sentiment: 'Neutral' as Sentiment,
            userType: 'Viewer' as UserType,
            source: postPlatform,
            timestamp: postDate.toISOString(),
            metadata: {
                is_post: true,
                likes: 500 + (seed % 500),
                views: 5000 + (seed % 5000),
                score: 100 + (seed % 200)
            }
        });
        
        // Генерируем комментарии
        for (let i = 0; i < 15; i++) {
            const randomIndex = (seed + i) % 1000;
            const sentiment = sentiments[randomIndex % 3];
            const userType = userTypes[randomIndex % 2];
            let text = '';
            
            if (sentiment === 'Positive') {
                text = positiveTexts[randomIndex % positiveTexts.length];
            } else if (sentiment === 'Negative') {
                text = negativeTexts[randomIndex % negativeTexts.length];
            } else {
                text = neutralTexts[randomIndex % neutralTexts.length];
            }
            
            const commentDate = new Date(activity.date);
            commentDate.setDate(commentDate.getDate() + (randomIndex % 5));
            
            mockComments.push({
                id: 10000 + activity.id * 100 + i,
                activityId: activity.id,
                text,
                author: `User${randomIndex}`,
                sentiment,
                userType,
                source: sources[randomIndex % sources.length],
                timestamp: commentDate.toISOString(),
                metadata: {
                    likes: (randomIndex % 50),
                    score: sentiment === 'Positive' ? (randomIndex % 20) + 10 : (randomIndex % 10)
                }
            });
        }
        
        return mockComments;
    }, [activity?.id, allComments]); // Добавили allComments в зависимости

    // Обновляем ref при изменении activity или данных
    useEffect(() => {
        if (!activity) return;
        
        // Всегда обновляем метрики при открытии модала для новой активности
        metricsRef.current = {
            length: allMetrics.length,
            lastUpdate: Date.now(),
            metrics: [...allMetrics] // Создаем копию
        };
        const existingComments = allComments.filter(c => c.activityId === activity.id);
        commentsRef.current = { activityId: activity.id, comments: existingComments };
    }, [activity?.id, allMetrics, allComments]);

    const analysis = useMemo(() => {
        if (!activity) return null;
        
        // Для активностей со статусом 'Upcoming' все равно показываем комментарии, но без метрик влияния

        // Если нет метрик, все равно возвращаем структуру для отображения комментариев
        const metricsByDate = new Map(metricsRef.current.metrics.map(m => [m.date, m]));
        const startDateStr = activity.startDate || activity.date;
        const endDateStr = activity.endDate || activity.date;

        // Ищем ближайшую метрику к дате начала (в пределах 7 дней)
        let startMetric = metricsByDate.get(startDateStr);
        if (!startMetric) {
            const startDate = new Date(startDateStr);
            for (let i = 0; i <= 7; i++) {
                const checkDate = new Date(startDate);
                checkDate.setDate(checkDate.getDate() - i);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                startMetric = metricsByDate.get(checkDateStr);
                if (startMetric) break;
            }
        }
        
        const endDay = new Date(endDateStr);
        endDay.setDate(endDay.getDate() + impactDays); // Используем выбранный диапазон
        const impactDateStr = endDay.toISOString().split('T')[0];
        
        // Ищем ближайшую метрику к дате окончания (в пределах 7 дней)
        let endMetric = metricsByDate.get(impactDateStr) || metricsByDate.get(endDateStr);
        if (!endMetric) {
            const targetDate = new Date(impactDateStr);
            for (let i = 0; i <= 7; i++) {
                const checkDate = new Date(targetDate);
                checkDate.setDate(checkDate.getDate() + i);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                endMetric = metricsByDate.get(checkDateStr);
                if (endMetric) break;
            }
        }

        // Если метрик нет, создаем пустые значения для отображения
        const defaultMetric = {
            dailyMentions: 0,
            engagementScore: 0,
            likes: 0,
            reach: 0,
            totalComments: 0,
            negativeComments: 0
        };
        
        const finalStartMetric = startMetric || defaultMetric;
        const finalEndMetric = endMetric || defaultMetric;
        
        const calculateChange = (start: number, end: number) => {
            if (start === 0) return end > 0 ? Infinity : 0;
            return ((end - start) / start) * 100;
        };
        
        const relevantComments = commentsWithMock.filter(c => c.activityId === activity.id);
        
        // Находим пост (комментарий с флагом is_post)
        const post = relevantComments.find(c => c.metadata?.is_post === true);
        
        // Комментарии к посту (без самого поста)
        const postComments = relevantComments.filter(c => !c.metadata?.is_post);

        // Получаем последние 7 дней метрик для графиков (или все доступные, если меньше 7)
        const last7DaysMetrics = metricsRef.current.metrics.length > 0 
            ? metricsRef.current.metrics.slice(-7) 
            : [];
        const last7DaysData = last7DaysMetrics.length > 0
            ? last7DaysMetrics.map(m => ({
                dailyMentions: m.dailyMentions || 0,
                engagementScore: m.engagementScore || 0,
                likes: m.likes || 0,
                reach: m.reach || 0,
                totalComments: m.totalComments || 0,
                negativeComments: m.negativeComments || 0,
            }))
            : Array(7).fill(null).map((_, i) => ({
                dailyMentions: 0,
                engagementScore: 0,
                likes: 0,
                reach: 0,
                totalComments: 0,
                negativeComments: 0,
            }));

        return {
            // Социальные метрики
            mentions: calculateChange(finalStartMetric.dailyMentions, finalEndMetric.dailyMentions),
            engagement: calculateChange(finalStartMetric.engagementScore, finalEndMetric.engagementScore),
            likes: calculateChange(finalStartMetric.likes, finalEndMetric.likes),
            reach: calculateChange(finalStartMetric.reach, finalEndMetric.reach),
            totalComments: calculateChange(finalStartMetric.totalComments, finalEndMetric.totalComments),
            negativeComments: calculateChange(finalStartMetric.negativeComments, finalEndMetric.negativeComments),
            
            // Значения для отображения
            mentionsValue: finalEndMetric.dailyMentions.toLocaleString(),
            engagementValue: finalEndMetric.engagementScore.toLocaleString(),
            likesValue: finalEndMetric.likes.toLocaleString(),
            reachValue: finalEndMetric.reach.toLocaleString(),
            totalCommentsValue: finalEndMetric.totalComments.toLocaleString(),
            negativeCommentsValue: finalEndMetric.negativeComments.toLocaleString(),
            
            // Данные для графиков
            last7DaysData,
            last7DaysMetrics: last7DaysMetrics.length > 0 ? last7DaysMetrics : Array(7).fill(defaultMetric),
            
            // Пост и комментарии
            post,
            comments: postComments,
            positiveComments: postComments.filter(c => c.sentiment === 'Positive').slice(0, 10),
            negativeCommentsList: postComments.filter(c => c.sentiment === 'Negative').slice(0, 10),
            neutralComments: postComments.filter(c => c.sentiment === 'Neutral').slice(0, 5),
        }
    }, [activity?.id, activity?.status, activity?.date, activity?.startDate, activity?.endDate, impactDays, commentsWithMock, metricsVersion]);

    // Загрузка AI инсайтов при открытии модала (только один раз)
    useEffect(() => {
        if (!activity || !analysis) return;
        
        // Если уже есть инсайт, не пересчитываем
        if (aiInsight) return;
        
        if (analysis.comments.length > 0) {
            setIsLoadingAi(true);
            
            // Используем простой анализ на основе sentiment
            const positive = analysis.positiveComments.length;
            const negative = analysis.negativeCommentsList.length;
            const neutral = analysis.neutralComments.length;
            const total = analysis.comments.length;
            
            const positivePercent = Math.round((positive / total) * 100);
            const negativePercent = Math.round((negative / total) * 100);
            
            let insight = '';
            if (positivePercent > 60) {
                insight = `Very positive community reaction! ${positivePercent}% positive comments. Users highly appreciated this post.`;
            } else if (negativePercent > 40) {
                insight = `Cautious reaction: ${negativePercent}% negative comments. It's recommended to pay attention to the main issues in the feedback.`;
            } else {
                insight = `Mixed reaction: ${positivePercent}% positive, ${negativePercent}% negative comments. The audience is divided in opinions.`;
            }
            
            // Добавляем информацию о цели кампании, если она указана
            if (campaignGoal) {
                insight += ` Campaign goal: ${campaignGoal}.`;
            }
            
            // Имитируем задержку анализа
            const timer = setTimeout(() => {
                setAiInsight(insight);
                setIsLoadingAi(false);
            }, 1500);

            return () => clearTimeout(timer);
        } else {
            setAiInsight('Not enough comments for sentiment analysis.');
            setIsLoadingAi(false);
        }
    }, [activity?.id, campaignGoal, analysis?.comments.length]); // Добавили analysis в зависимости

    // Вычисляем статус кампании (Live/Ended) - ДО условного возврата
    const campaignStatus = useMemo(() => {
        if (!activity) return 'Upcoming';
        const now = new Date();
        const startDate = activity.startDate ? new Date(activity.startDate) : new Date(activity.date);
        const endDate = activity.endDate ? new Date(activity.endDate) : null;
        
        if (endDate && now > endDate) {
            return 'Ended';
        }
        if (now >= startDate) {
            return 'Live';
        }
        return 'Upcoming';
    }, [activity]);

    // Дата старта кампании (из поста или activity.date) - ДО условного возврата
    const campaignStartDate = useMemo(() => {
        if (!activity) return new Date();
        if (analysis?.post?.timestamp) {
            return new Date(analysis.post.timestamp);
        }
        return activity.startDate ? new Date(activity.startDate) : new Date(activity.date);
    }, [activity, analysis?.post?.timestamp]);

    // Отфильтрованные комментарии по выбранной категории - ДО условного возврата
    const filteredComments = useMemo(() => {
        if (!analysis) return [];
        if (selectedCommentCategory === 'all') {
            return analysis.comments;
        }
        return analysis.comments.filter(c => c.sentiment === selectedCommentCategory);
    }, [analysis, selectedCommentCategory]);

    if (!activity || !modalRoot) return null;

    return ReactDOM.createPortal(
        <>
            {/* Затемненный фон только справа от панели - с вырезом для Activity Feed */}
            {activityFeedLeft > 0 && activityFeedRight > 0 && panelWidth > 0 ? (
                <>
                    {/* Фон между панелью и Activity Feed (если есть промежуток) */}
                    {activityFeedLeft > panelWidth && (
                        <div
                            className="fixed top-0 bottom-0 bg-black/40 z-[9999]"
                            style={{ 
                                left: `${panelWidth}px`,
                                width: `${activityFeedLeft - panelWidth}px`
                            }}
                            onClick={onClose}
                        />
                    )}
                    {/* Фон справа от Activity Feed */}
                    <div
                        className="fixed top-0 right-0 bottom-0 bg-black/40 z-[9999]"
                        style={{ left: `${activityFeedRight}px` }}
                        onClick={onClose}
                    />
                </>
            ) : (
                <div
                    className="fixed top-0 right-0 bottom-0 bg-black/40 z-[9999]"
                    style={{ left: panelWidth > 0 ? `${panelWidth}px` : 'calc(100vw - 33.333% - 1.5rem - 5rem)' }}
                    onClick={onClose}
                />
            )}
            {/* Панель с деталями */}
            <div 
                className={`glass-card fixed left-0 top-0 h-full flex flex-col shadow-2xl shadow-black/40 transition-transform duration-300 ease-out z-[10000] ${shouldAnimate ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ width: panelWidth > 0 ? `${panelWidth}px` : 'calc(100vw - 33.333% - 1.5rem - 5rem)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header с информацией о посте */}
                <div className="flex items-start justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {activity.platforms.map(platform => (
                                <div key={platform} className="flex items-center gap-2">
                                    {getPlatformIcon(platform as any, 'w-6 h-6')}
                                    <span className="text-brand-text-secondary text-sm">{platform}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-brand-primary font-bold mb-1">{activity.type}</p>
                        <h3 className="text-lg font-semibold text-brand-text-primary mb-2">{activity.description}</h3>
                        <p className="text-sm text-brand-text-secondary">
                            {new Date(activity.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    {analysis ? (
                        <div className="space-y-6">
                            {/* Post content, if available - Временно скрыто - возможно вернемся */}
                            {/* {analysis.post && (
                                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-brand-text-primary mb-3 flex items-center gap-2">
                                        <FaComment className="text-brand-primary" />
                                        Post Content
                                    </h4>
                                    <p className="text-brand-text-secondary whitespace-pre-wrap">{analysis.post.text}</p>
                                    
                                    {analysis.post.metadata && (
                                        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                                            {analysis.post.metadata.likes !== undefined && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaHeart className="text-pink-400" />
                                                    <span className="text-brand-text-primary font-medium">{analysis.post.metadata.likes.toLocaleString()}</span>
                                                    <span className="text-brand-text-secondary">likes</span>
                                                </div>
                                            )}
                                            {analysis.post.metadata.views !== undefined && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaEye className="text-blue-400" />
                                                    <span className="text-brand-text-primary font-medium">{analysis.post.metadata.views.toLocaleString()}</span>
                                                    <span className="text-brand-text-secondary">views</span>
                                                </div>
                                            )}
                                            {analysis.comments.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaComment className="text-green-400" />
                                                    <span className="text-brand-text-primary font-medium">{analysis.comments.length}</span>
                                                    <span className="text-brand-text-secondary">comments</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )} */}

                            {/* Campaign Goal Input - Временно скрыто - возможно вернемся */}
                            {/* <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                                <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                                    Campaign Goal
                                </label>
                                <textarea
                                    value={campaignGoal}
                                    onChange={(e) => setCampaignGoal(e.target.value)}
                                    placeholder="Enter the campaign goal (e.g., Increase engagement by 30%, Reach 10K new followers, etc.)"
                                    className="w-full bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:border-brand-primary resize-none"
                                    rows={2}
                                />
                            </div> */}

                            {/* AI Insight */}
                            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/30">
                                <h4 className="font-semibold text-brand-text-primary mb-2 flex items-center gap-2">
                                    <FaRobot className="text-brand-primary" />
                                    AI Sentiment Analysis
                                </h4>
                                {isLoadingAi ? (
                                    <div className="flex items-center gap-2 text-brand-text-secondary">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                                        <span className="animate-pulse">Analyzing Campaign...</span>
                                    </div>
                                ) : aiInsight ? (
                                    <p className="text-brand-text-secondary">{aiInsight}</p>
                                ) : (
                                    <p className="text-brand-text-secondary text-sm italic">Click to analyze campaign sentiment based on comments and goal</p>
                                )}
                            </div>

                            {/* Impact on metrics - во всю ширину */}
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-brand-text-primary text-lg mb-2">Impact on Metrics</h4>
                                        <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                                            <div className="flex items-center gap-2">
                                                <span>Campaign Started:</span>
                                                <span className="text-brand-text-primary font-medium">
                                                    {campaignStartDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>Status:</span>
                                                <span className={`font-medium px-2 py-0.5 rounded ${
                                                    campaignStatus === 'Live' 
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                        : campaignStatus === 'Ended'
                                                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                }`}>
                                                    {campaignStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <label className="text-xs text-brand-text-secondary">
                                            Measure interest change over:
                                        </label>
                                        <select
                                            value={impactDays}
                                            onChange={(e) => setImpactDays(Number(e.target.value))}
                                            className="bg-brand-surface border border-brand-border rounded-md px-3 py-1.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-primary"
                                        >
                                            <option value={1}>1 day from start</option>
                                            <option value={3}>3 days from start</option>
                                            <option value={7}>7 days from start</option>
                                            <option value={14}>14 days from start</option>
                                            <option value={30}>30 days from start</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <MetricCard 
                                        title="Mentions" 
                                        value={analysis.mentionsValue || '0'} 
                                        change={analysis.mentions} 
                                        strokeColor="#3B82F6"
                                        data={analysis.last7DaysData || []}
                                        dataKey="dailyMentions"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="dailyMentions"
                                    />
                                    <MetricCard 
                                        title="Engagement" 
                                        value={analysis.engagementValue || '0'} 
                                        change={analysis.engagement} 
                                        strokeColor="#10B981"
                                        data={analysis.last7DaysData || []}
                                        dataKey="engagementScore"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="engagementScore"
                                    />
                                    <MetricCard 
                                        title="Likes" 
                                        value={analysis.likesValue || '0'} 
                                        change={analysis.likes} 
                                        strokeColor="#EC4899"
                                        data={analysis.last7DaysData || []}
                                        dataKey="likes"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="likes"
                                    />
                                    <MetricCard 
                                        title="Reach" 
                                        value={analysis.reachValue || '0'} 
                                        change={analysis.reach} 
                                        strokeColor="#8B5CF6"
                                        data={analysis.last7DaysData || []}
                                        dataKey="reach"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="reach"
                                    />
                                    <MetricCard 
                                        title="Comments" 
                                        value={analysis.totalCommentsValue || '0'} 
                                        change={analysis.totalComments} 
                                        strokeColor="#F59E0B"
                                        data={analysis.last7DaysData || []}
                                        dataKey="totalComments"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="totalComments"
                                    />
                                    <MetricCard 
                                        title="Negative Comments" 
                                        value={analysis.negativeCommentsValue || '0'} 
                                        change={analysis.negativeComments} 
                                        isNegative
                                        strokeColor="#EF4444"
                                        data={analysis.last7DaysData || []}
                                        dataKey="negativeComments"
                                        fullMetrics={analysis.last7DaysMetrics}
                                        metricKey="negativeComments"
                                    />
                                </div>
                            </div>

                            {/* Comments - универсальная секция с выбором категории */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-brand-text-primary text-lg">Community Reaction</h4>
                                    {analysis && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedCommentCategory('all')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                                    selectedCommentCategory === 'all'
                                                        ? 'bg-brand-primary text-white'
                                                        : 'bg-brand-surface text-brand-text-secondary hover:bg-white/5'
                                                }`}
                                            >
                                                All ({analysis.comments.length})
                                            </button>
                                            <button
                                                onClick={() => setSelectedCommentCategory('Positive')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                                                    selectedCommentCategory === 'Positive'
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                        : 'bg-brand-surface text-brand-text-secondary hover:bg-white/5'
                                                }`}
                                            >
                                                <FaCheckCircle className="w-3 h-3" />
                                                Positive ({analysis.positiveComments.length})
                                            </button>
                                            <button
                                                onClick={() => setSelectedCommentCategory('Negative')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                                                    selectedCommentCategory === 'Negative'
                                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                        : 'bg-brand-surface text-brand-text-secondary hover:bg-white/5'
                                                }`}
                                            >
                                                <FaTimesCircle className="w-3 h-3" />
                                                Negative ({analysis.negativeCommentsList.length})
                                            </button>
                                            <button
                                                onClick={() => setSelectedCommentCategory('Neutral')}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                                                    selectedCommentCategory === 'Neutral'
                                                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                                        : 'bg-brand-surface text-brand-text-secondary hover:bg-white/5'
                                                }`}
                                            >
                                                <FaMinusCircle className="w-3 h-3" />
                                                Neutral ({analysis.neutralComments.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-y-auto pr-2 space-y-4" style={{ maxHeight: '500px' }}>
                                    {filteredComments.length > 0 ? (
                                        filteredComments.map(comment => (
                                            <CommentCard key={comment.id} comment={comment} />
                                        ))
                                    ) : (
                                        <p className="text-sm text-brand-text-secondary text-center py-8">
                                            No {selectedCommentCategory === 'all' ? '' : selectedCommentCategory.toLowerCase()} comments found for this post yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-brand-text-secondary">
                            <p>Impact data for this activity is not yet available</p>
                        </div>
                    )}
                </div>
            </div>
        </>,
        modalRoot
    );
};