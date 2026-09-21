import type { LucideIcon } from 'lucide-react';
import { Sparkles, Gamepad2, User, Gift, Repeat, Zap, Monitor } from 'lucide-react';

export interface CategoryDef {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subcategories?: { label: string; value: string }[];
}

export const CATEGORIES: CategoryDef[] = [
  { label: 'All',           value: 'all',          icon: Sparkles,  color: 'text-white' },
  { 
    label: 'Games',         
    value: 'games',        
    icon: Gamepad2,  
    color: 'text-blue-400',
    subcategories: [
      { label: 'Xbox', value: 'games_xbox' },
      { label: 'Play Station', value: 'games_ps' },
      { label: 'Steam', value: 'games_steam' },
      { label: 'GOG', value: 'games_gog' },
      { label: 'Others', value: 'games_others' }
    ]
  },
  { 
    label: 'Accounts',         
    value: 'accounts',        
    icon: User,  
    color: 'text-teal-400',
    subcategories: [
      { label: 'Games', value: 'accounts_games' },
      { label: 'Application', value: 'accounts_app' },
      { label: 'Others', value: 'accounts_others' }
    ]
  },
  { 
    label: 'Gift card',    
    value: 'giftcard',     
    icon: Gift,      
    color: 'text-pink-400',
    subcategories: [
      { label: 'XBOX', value: 'giftcard_xbox' },
      { label: 'STEAM', value: 'giftcard_steam' },
      { label: 'PlayStation', value: 'giftcard_ps' },
      { label: 'Others', value: 'giftcard_others' }
    ]
  },
  { 
    label: 'Subscription', 
    value: 'subscription', 
    icon: Repeat,    
    color: 'text-purple-400',
    subcategories: [
      { label: 'Game Pass', value: 'sub_gamepass' },
      { label: 'PSN', value: 'sub_psn' },
      { label: 'EA', value: 'sub_ea' },
      { label: 'Others', value: 'sub_others' }
    ]
  },
  { 
    label: 'Top up',       
    value: 'topup',        
    icon: Zap,       
    color: 'text-yellow-400',
    subcategories: [
      { label: 'Games', value: 'topup_games' },
      { label: 'Telegram', value: 'topup_telegram' },
      { label: 'TikTok', value: 'topup_tiktok' },
      { label: 'Twitch', value: 'topup_twitch' },
      { label: 'Social Media', value: 'topup_social' },
      { label: 'Others', value: 'topup_others' }
    ]
  },
  { label: 'Request Custom Orders', value: 'custom_orders', icon: Monitor, color: 'text-orange-400' },
];

export const SORT_OPTIONS = [
  { label: 'Newest',        value: 'newest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
  { label: 'Name A–Z',      value: 'name_asc' },
];

export type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
