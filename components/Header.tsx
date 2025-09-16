import React from 'react';
import { DateRange } from '../types';

interface HeaderProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<{ value: DateRange, onChange: (value: DateRange) => void }> = ({ value, onChange }) => {
    const ranges: { id: DateRange, label: string }[] = [
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' },
        { id: '90d', label: '90D' },
    ];

    return (
        <div className="bg-brand-surface p-1 rounded-lg border border-brand-border flex items-center space-x-1">
            {ranges.map(range => (
                <button
                    key={range.id}
                    onClick={() => onChange(range.id)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        value === range.id
                            ? 'bg-brand-primary text-white'
                            : 'text-brand-text-secondary hover:bg-brand-surface-2'
                    }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ dateRange, setDateRange }) => {
    return (
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
                <img src="https://storage.googleapis.com/corepunk-static/pages/logos/game-logo.webp" alt="Corepunk Logo" className="h-16 w-auto" />
                <div>
                    <h1 className="text-5xl font-bold text-brand-text-primary">Corepunk Command Center</h1>
                    <p className="text-brand-text-secondary mt-1">Analytics & Community Pulse</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
        </header>
    );
};