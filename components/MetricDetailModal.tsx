import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { DailyMetric } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    metricKey: keyof DailyMetric;
    title: string;
    description: string;
    metrics: DailyMetric[];
    strokeColor: string;
    currentValue: string;
    change: number;
    changeType?: 'positive' | 'negative';
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
    isOpen,
    onClose,
    metricKey,
    title,
    description,
    metrics,
    strokeColor,
    currentValue,
    change,
    changeType = 'positive'
}) => {
    const modalRoot = document.getElementById('modal-root');

    // Подготавливаем данные для графика с разбивкой по платформам
    const chartData = useMemo(() => {
        return metrics.map(metric => {
            const dataPoint: any = {
                date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                total: metric[metricKey] as number || 0,
            };

            // Добавляем данные по платформам
            if (metric.byPlatform) {
                Object.entries(metric.byPlatform).forEach(([platform, platformData]) => {
                    // Маппинг ключей метрик
                    let value = 0;
                    if (metricKey === 'dailyMentions') {
                        value = platformData.dailyMentions || 0;
                    } else if (metricKey === 'likes') {
                        value = platformData.likes || 0;
                    } else if (metricKey === 'totalComments') {
                        value = platformData.comments || 0;
                    } else if (metricKey === 'reach') {
                        value = platformData.reach || 0;
                    } else if (metricKey === 'negativeComments') {
                        value = platformData.negativeComments || 0;
                    }

                    if (value > 0) {
                        dataPoint[platform] = value;
                    }
                });
            }

            return dataPoint;
        });
    }, [metrics, metricKey]);

    // Получаем список платформ для легенды
    const platforms = useMemo(() => {
        const platformSet = new Set<string>();
        metrics.forEach(metric => {
            if (metric.byPlatform) {
                Object.keys(metric.byPlatform).forEach(platform => platformSet.add(platform));
            }
        });
        return Array.from(platformSet);
    }, [metrics]);

    // Цвета для платформ
    const platformColors: Record<string, string> = {
        'Reddit': '#FF4500',
        'Youtube': '#FF0000',
        'Discord': '#5865F2',
        'Tiktok': '#000000',
        'Vk': '#0077FF',
    };

    if (!isOpen || !modalRoot) return null;

    const isPositive = change >= 0;
    const changeColor = (changeType === 'positive' ? isPositive : !isPositive) ? 'text-green-400' : 'text-red-400';

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
        >
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card w-full max-w-6xl my-8 flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-6 border-b border-brand-border flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-brand-text-primary mb-2">{title}</h2>
                            <p className="text-brand-text-secondary text-sm mb-4">{description}</p>

                            {/* Current Value */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-bold text-brand-primary">{currentValue}</span>
                                <div className={`flex items-center text-lg font-medium ${changeColor}`}>
                                    {isPositive ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-9.293l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>{Math.abs(change).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Chart */}
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Trend Over Time</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                    labelStyle={{ color: '#9CA3AF' }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="line"
                                />

                                {/* Total Line */}
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke={strokeColor}
                                    strokeWidth={3}
                                    name="Total"
                                    dot={{ fill: strokeColor, r: 4 }}
                                />

                                {/* Platform Lines */}
                                {platforms.map(platform => (
                                    <Line
                                        key={platform}
                                        type="monotone"
                                        dataKey={platform}
                                        stroke={platformColors[platform] || '#888888'}
                                        strokeWidth={2}
                                        name={platform}
                                        dot={{ fill: platformColors[platform] || '#888888', r: 3 }}
                                        strokeDasharray="3 3"
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Platform Breakdown */}
                        {platforms.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Platform Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {platforms.map(platform => {
                                        // Calculate total for platform
                                        const platformTotal = chartData.reduce((sum, point) => sum + (point[platform] || 0), 0);

                                        return (
                                            <div key={platform} className="bg-white/5 p-4 rounded-lg border border-brand-border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: platformColors[platform] || '#888888' }}
                                                    ></div>
                                                    <span className="text-sm font-medium text-brand-text-secondary">{platform}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-brand-text-primary">{platformTotal.toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        modalRoot
    );
};
