/**
 * @file input.tsx
 * @description Standardized form text input with label, sublabel hint, leading icon,
 * secure password visibility toggle, and validation error messages.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export interface InputProps extends TextInputProps {
  label?: string;
  subLabel?: string;
  subLabelColor?: string;
  leftIcon?: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  subLabel,
  subLabelColor,
  leftIcon,
  error,
  isPassword = false,
  style,
  ...rest
}: InputProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {(label || subLabel) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}
          {subLabel && (
            <Text
              style={[
                styles.subLabel,
                { color: subLabelColor || colors.outline },
              ]}>
              {subLabel}
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: error ? colors.error : isFocused ? colors.primaryContainer : colors.border,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            color={colors.outline}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          placeholderTextColor={colors.outline}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            {
              color: colors.onSurface,
            },
            style,
          ]}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.rightAction}>
            <Icon
              name={showPassword ? 'visibility_off' : 'visibility'}
              size={18}
              color={colors.outline}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  rightAction: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    fontSize: 11,
    marginTop: Spacing.xs - 2,
    fontWeight: '500',
  },
});

