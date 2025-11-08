import React from 'react';
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

export type PlatformName = 'all' | 'Reddit' | 'Youtube' | 'Instagram' | 'X' | 'Tiktok' | 'Vk' | 'Discord';

export const getPlatformIcon = (platform: PlatformName | string, size: string = 'w-4 h-4'): React.ReactNode => {
  // Нормализуем название платформы для поиска (приводим к единому формату)
  const normalizedPlatform = platform?.toString().trim();
  
  // Маппинг различных вариантов написания на стандартные ключи
  const platformAliases: Record<string, string> = {
    'YouTube': 'Youtube',
    'YOUTUBE': 'Youtube',
    'youtube': 'Youtube',
    'TikTok': 'Tiktok',
    'TIKTOK': 'Tiktok',
    'tiktok': 'Tiktok',
    'Twitter': 'X',
    'TWITTER': 'X',
    'twitter': 'X',
    'X': 'X',
    'x': 'X',
    'X.com': 'X',
    'x.com': 'X',
    'INSTAGRAM': 'Instagram',
    'instagram': 'Instagram',
    'REDDIT': 'Reddit',
    'reddit': 'Reddit',
    'VK': 'Vk',
    'vk': 'Vk',
    'DISCORD': 'Discord',
    'discord': 'Discord',
  };
  
  // Используем алиас если есть, иначе оригинальное название
  const platformKey = platformAliases[normalizedPlatform] || normalizedPlatform;
  
  const iconMap: Record<string, React.ReactNode> = {
    'all': <FaGlobe className={size} />,
    'Reddit': <FaReddit className={size} />,
    'Youtube': <FaYoutube className={size} />,
    'Instagram': <FaInstagram className={size} />,
    'X': <FaXTwitter className={size} />,
    'Twitter': <FaXTwitter className={size} />, // Поддержка старого названия для обратной совместимости
    'Tiktok': <FaTiktok className={size} />,
    'TikTok': <FaTiktok className={size} />, // Дополнительный вариант
    'Vk': <FaVk className={size} />,
    'Discord': <FaDiscord className={size} />,
  };

  const icon = iconMap[platformKey];
  
  // Если иконка не найдена, возвращаем fallback иконку вместо null
  if (!icon && normalizedPlatform) {
    console.warn(`Platform icon not found for: "${platform}" (normalized: "${platformKey}")`);
    return <FaGlobe className={size} />; // Fallback иконка
  }
  
  return icon || null;
};

export const getPlatformColor = (platform: PlatformName | string): string => {
  // Нормализуем название платформы для поиска
  const normalizedPlatform = platform?.toString().trim();
  
  // Маппинг различных вариантов написания на стандартные ключи
  const platformAliases: Record<string, string> = {
    'YouTube': 'Youtube',
    'YOUTUBE': 'Youtube',
    'youtube': 'Youtube',
    'TikTok': 'Tiktok',
    'TIKTOK': 'Tiktok',
    'tiktok': 'Tiktok',
    'Twitter': 'X',
    'TWITTER': 'X',
    'twitter': 'X',
    'X': 'X',
    'x': 'X',
    'X.com': 'X',
    'x.com': 'X',
    'INSTAGRAM': 'Instagram',
    'instagram': 'Instagram',
    'REDDIT': 'Reddit',
    'reddit': 'Reddit',
    'VK': 'Vk',
    'vk': 'Vk',
    'DISCORD': 'Discord',
    'discord': 'Discord',
  };
  
  const platformKey = platformAliases[normalizedPlatform] || normalizedPlatform;
  
  const colorMap: Record<string, string> = {
    'Reddit': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Youtube': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Instagram': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'X': 'bg-black/20 text-gray-300 border-gray-500/30',
    'Twitter': 'bg-black/20 text-gray-300 border-gray-500/30', // Поддержка старого названия
    'Tiktok': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'TikTok': 'bg-pink-500/20 text-pink-400 border-pink-500/30', // Дополнительный вариант
    'Vk': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Discord': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  return colorMap[platformKey] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

