/**
 * @file icon.tsx
 * @description Cross-platform Lucide SVG icon renderer.
 * Uses native SVG paths instead of a font, so icon names can never render as text.
 */

import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Lucide from 'lucide-react-native';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const iconNames: Record<string, string> = {
  account_balance_wallet: 'WalletCards', add: 'Plus', add_photo_alternate: 'ImagePlus', bookmark: 'Bookmark', bookmark_border: 'Bookmark',
  arrow_back: 'ArrowLeft', arrow_forward: 'ArrowRight', assignment: 'ClipboardList',
  assignment_add: 'ClipboardPlus', auto_awesome: 'Sparkles', badge: 'Badge', build: 'Wrench',
  calendar_month: 'CalendarDays', cancel: 'CircleX', category: 'Tags', chat: 'MessageCircle', check: 'Check',
  check_circle: 'CircleCheck', close: 'X', collections: 'Images', delete: 'Trash2',
  description: 'FileText', edit: 'Pencil', edit_note: 'FilePenLine', engineering: 'HardHat',
  error: 'CircleAlert', event: 'Calendar', event_available: 'CalendarCheck', explore: 'Compass',
  flag: 'Flag', folder_special: 'FolderHeart', format_quote: 'Quote', group: 'Users', groups: 'UsersRound',
  handshake: 'Handshake', handyman: 'Hammer', home: 'House', info: 'CircleInfo',
  history: 'History',
  inventory_2: 'Package', laptop_mac: 'Laptop', location_on: 'MapPin', lock: 'Lock',
  lock_reset: 'KeyRound', logout: 'LogOut', mail: 'Mail', near_me: 'Navigation', palette: 'Palette',
  notifications: 'Bell', payments: 'Banknote', person: 'User', photo_camera: 'Camera', photo_library: 'Images',
  pin_drop: 'MapPin', post_add: 'FilePlus', psychology: 'Brain', radio_button_checked: 'CircleDot',
  radio_button_unchecked: 'Circle', rate_review: 'MessageSquareText',
  schedule: 'Clock3', school: 'GraduationCap', search: 'Search', sell: 'Tag', send: 'Send',
  shield: 'Shield', star: 'Star', stars: 'Stars', storefront: 'Store', sync_alt: 'ArrowLeftRight',
  task_alt: 'CircleCheckBig', travel_explore: 'Map', tune: 'SlidersHorizontal',
  verified: 'BadgeCheck', verified_user: 'ShieldCheck', visibility: 'Eye', visibility_off: 'EyeOff',
  volunteer_activism: 'HeartHandshake', wb_twilight: 'Sunset', sunny: 'Sun', dark_mode: 'Moon',
};

export function Icon({ name, size = 20, color = '#0F172A', filled = false, style }: IconProps) {
  const IconComponent = (Lucide as Record<string, React.ComponentType<any>>)[iconNames[name]]
    ?? (Lucide as Record<string, React.ComponentType<any>>).CircleHelp;

  return (
    <IconComponent
      accessibilityRole="image"
      accessibilityLabel={name.replaceAll('_', ' ')}
      color={color}
      size={size}
      strokeWidth={filled ? 2.5 : 2}
      fill={filled ? color : 'none'}
      style={style}
    />
  );
}

