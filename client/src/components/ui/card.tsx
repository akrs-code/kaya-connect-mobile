/**
 * @file card.tsx
 * @description Standardized card surface container supporting selection states, clickable interactions, and semantic color tints.
 */

import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface CardProps extends ViewProps {
  selected?: boolean;
  onPress?: () => void;
  variant?: 'surface' | 'secondary' | 'paid' | 'volunteer';
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  selected = false,
  onPress,
  variant = 'surface',
  style,
  ...rest
}: CardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'paid':
        return colors.paidBg;
      case 'volunteer':
        return colors.volunteerBg;
      case 'secondary':
        return colors.surfaceSecondary;
      case 'surface':
      default:
        return colors.surface;
    }
  };

  const borderStyle: ViewStyle = {
    borderColor: selected ? colors.primaryContainer : colors.border,
    borderWidth: selected ? 2 : 1,
  };

  const cardStyle = [
    styles.card,
    borderStyle,
    { backgroundColor: getBackgroundColor() },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
        {...rest}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

