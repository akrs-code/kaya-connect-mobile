/**
 * @file theme.ts
 * @description Uniform design tokens and color definitions for the KayaConnect mobile application,
 * matching the application's light-first visual system.
 */

import '@/global.css';

import { Platform } from 'react-native';

const lightColors = {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#EFF6FF',
    textSecondary: '#475569',

    // Core Brand Tokens
    primary: '#2563EB',
    primaryContainer: '#2563EB',
    primaryHover: '#1D4ED8',
    onPrimary: '#FFFFFF',
    primaryCtaHover: '#1D4ED8',

    // Surfaces & Canvas
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    surfaceContainerLow: '#F8FAFC',
    border: '#E2E8F0',

    // Content & Typography
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    outline: '#64748B',
    outlineVariant: '#CBD5E1',

    // Secondary & Civic / Mutual Aid
    secondary: '#0F766E',
    secondaryContainer: '#CCFBF1',
    onSecondary: '#FFFFFF',
    volunteerBg: '#DCFCE7',
    volunteerText: '#166534',

    // Gigs & Financial Accents
    paidBg: '#EFF6FF',
    paidText: '#1D4ED8',

    // States & Alerts
    error: '#B91C1C',
    errorContainer: '#FEE2E2',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    alertBg: '#FEE2E2',
    alertText: '#991B1B',
} as const;

/**
 * The app intentionally ships a single, bright appearance. Keeping the legacy
 * key as an alias avoids a risky, broad component migration while guaranteeing
 * that a system dark preference can never render a dark surface.
 */
export const Colors = {
  light: lightColors,
  dark: lightColors,
} as const;

export type ThemeColors = typeof Colors.light | typeof Colors.dark;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  gutter: 16,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;
