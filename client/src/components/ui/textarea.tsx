/**
 * @file textarea.tsx
 * @description Standardized multiline textarea with live character counter, label, helper text, and error states.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface TextareaProps extends TextInputProps {
  label?: string;
  subLabel?: string;
  helperText?: string;
  maxLength?: number;
  rows?: number;
  error?: string;
}

export function Textarea({
  label,
  subLabel,
  helperText,
  maxLength,
  rows = 3,
  value,
  error,
  style,
  ...rest
}: TextareaProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [isFocused, setIsFocused] = useState(false);

  const currentLength = (value ? String(value) : '').length;
  const isOverLimit = maxLength !== undefined && currentLength > maxLength;

  return (
    <View style={styles.container}>
      {(label || subLabel) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}
          {subLabel && (
            <Text style={[styles.subLabel, { color: colors.outline }]}>{subLabel}</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: error || isOverLimit ? colors.error : isFocused ? colors.primaryContainer : colors.border,
            borderWidth: isFocused || error || isOverLimit ? 1.5 : 1,
            minHeight: rows * 24 + Spacing.lg,
          },
        ]}>
        <TextInput
          multiline
          textAlignVertical="top"
          value={value}
          maxLength={maxLength ? maxLength + 20 : undefined} // allow slight typing so user sees error
          placeholderTextColor={colors.outline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            {
              color: colors.onSurface,
              minHeight: rows * 22,
            },
            style,
          ]}
          {...rest}
        />
      </View>

      <View style={styles.bottomRow}>
        {helperText ? (
          <Text style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
            {helperText}
          </Text>
        ) : (
          <View />
        )}
        {maxLength !== undefined && (
          <Text
            style={[
              styles.counterText,
              { color: isOverLimit ? colors.error : colors.outline },
            ]}>
            {currentLength}/{maxLength}
          </Text>
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
    fontSize: 12,
    fontWeight: '400',
  },
  inputContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs - 1,
  },
  helperText: {
    fontSize: 11,
    flex: 1,
    marginRight: Spacing.sm,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    marginTop: Spacing.xs - 2,
    fontWeight: '500',
  },
});

