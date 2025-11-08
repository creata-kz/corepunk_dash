import React from 'react';
import type { PlatformFilter } from '../types';
import { 
  FaGlobe, 
  FaReddit, 
  FaYoutube, 
  FaInstagram, 
  FaXTwitter,
  FaTiktok, 
  FaVk, 
  FaDiscord 
} from 'react-icons/fa6';

interface SidebarProps {
  platformFilter: PlatformFilter;
  setPlatformFilter: (platform: PlatformFilter) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ platformFilter, setPlatformFilter }) => {
  const platforms: { id: PlatformFilter, label: string, icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <FaGlobe className="w-4 h-4" /> },
    { id: 'Reddit', label: 'Reddit', icon: <FaReddit className="w-4 h-4" /> },
    { id: 'Youtube', label: 'YouTube', icon: <FaYoutube className="w-4 h-4" /> },
    { id: 'Instagram', label: 'Instagram', icon: <FaInstagram className="w-4 h-4" /> },
    { id: 'X', label: 'X', icon: <FaXTwitter className="w-4 h-4" /> },
    { id: 'Tiktok', label: 'TikTok', icon: <FaTiktok className="w-4 h-4" /> },
    { id: 'Vk', label: 'VK', icon: <FaVk className="w-4 h-4" /> },
    { id: 'Discord', label: 'Discord', icon: <FaDiscord className="w-4 h-4" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-brand-surface/80 backdrop-blur-lg border-r border-brand-border z-50 flex flex-col items-center py-6">
      <div className="flex flex-col gap-2 w-full px-2">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setPlatformFilter(platform.id)}
            className={`w-full p-3 rounded-lg transition-colors flex flex-col items-center gap-1.5 ${
              platformFilter === platform.id
                ? 'bg-brand-primary text-white'
                : 'text-brand-text-secondary hover:bg-brand-surface-2'
            }`}
            title={platform.label}
          >
            {platform.icon}
            <span className="text-[10px] font-medium">{platform.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

