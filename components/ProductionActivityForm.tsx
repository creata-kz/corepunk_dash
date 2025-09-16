

import React, { useState } from 'react';
import { ProductionActivity, ProductionActivityType } from '../types';

interface ProductionActivityFormProps {
  onAddActivity: (activity: Omit<ProductionActivity, 'id'>) => void;
}

export const ProductionActivityForm: React.FC<ProductionActivityFormProps> = ({ onAddActivity }) => {
  const [type, setType] = useState<ProductionActivityType>(ProductionActivityType.Hotfix);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    
    // FIX: Add missing 'status' and 'platforms' properties to the activity object to match the required type.
    // Status is determined based on the date, and platforms are given sensible defaults based on the activity type.
    const today = new Date().toISOString().split('T')[0];
    let status: 'Upcoming' | 'In Progress' | 'Completed';
    if (date > today) {
      status = 'Upcoming';
    } else if (date === today) {
      status = 'In Progress';
    } else {
      status = 'Completed';
    }

    let platforms: string[];
    switch (type) {
      case ProductionActivityType.Release:
      case ProductionActivityType.Hotfix:
        platforms = ['In-Game'];
        break;
      case ProductionActivityType.MarketingCampaign:
        platforms = ['TikTok', 'YouTube', 'Twitter'];
        break;
      case ProductionActivityType.CommunityEvent:
        platforms = ['Discord'];
        break;
      case ProductionActivityType.PRPublication:
        platforms = ['Web'];
        break;
      default:
        platforms = [];
    }

    onAddActivity({ type, date, description, status, platforms });
    setDescription('');
  };

  return (
    <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-3">Add Production Activity</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="activity-type" className="block text-sm font-medium text-brand-text-secondary mb-1">Activity Type</label>
          <select
            id="activity-type"
            value={type}
            onChange={(e) => setType(e.target.value as ProductionActivityType)}
            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            {Object.values(ProductionActivityType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="activity-date" className="block text-sm font-medium text-brand-text-secondary mb-1">Date</label>
          <input
            id="activity-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="activity-desc" className="block text-sm font-medium text-brand-text-secondary mb-1">Description</label>
          <input
            id="activity-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Patch 1.5.4 released"
            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
          disabled={!description}
        >
          Add Activity
        </button>
      </form>
    </div>
  );
};
