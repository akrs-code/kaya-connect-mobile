/**
 * @file reports/create.tsx
 * @description Screen 7.3 — Content & User Reporting Sheet.
 *
 * Why: Empowers campus users to report safety concerns, payment fraud, harassment,
 * or Honor Code violations confidentially. Backed by POST /reports.
 * Gold-plated mockup attachments stripped as backend report schema accepts
 * { targetType, targetId, category, description }.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { reportsService } from '@/api/services/reports.service';
import { ReportCategory, ReportTargetType } from '@/api/types';
import { AppShell, Button, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

interface CategoryOption {
  key: ReportCategory;
  title: string;
  subtitle: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    key: 'fraud',
    title: 'Misleading Task or Payment Fraud',
    subtitle: 'Task scope differed drastically from agreement or payment was falsely claimed.',
  },
  {
    key: 'harassment',
    title: 'Harassing or Offensive Content',
    subtitle: 'Vulgar language, discriminatory remarks, intimidation, or inappropriate contact.',
  },
  {
    key: 'inappropriate',
    title: 'Unsafe Conditions or Code Violation',
    subtitle: 'Hazardous off-campus tasks, unauthorized dorm access, or housing violations.',
  },
  {
    key: 'spam',
    title: 'Spam, Duplicate, or Commercial Solicitation',
    subtitle: 'Repeated listings, multi-level recruitment, or off-platform advertisements.',
  },
  {
    key: 'other',
    title: 'Other Campus Policy Infraction',
    subtitle: 'Non-compliant behavior covered under MSU Student Handbook guidelines.',
  },
];

export default function CreateReportScreen() {
  const params = useLocalSearchParams<{
    targetType?: string;
    targetId?: string;
    targetTitle?: string;
    category?: string;
  }>();

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const [targetType, setTargetType] = useState<ReportTargetType>(
    params.targetType === 'user' ? 'user' : 'opportunity'
  );
  const [targetId, setTargetId] = useState<string>(params.targetId ?? '');
  const [category, setCategory] = useState<ReportCategory>(
    (params.category as ReportCategory) || 'fraud'
  );
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cleanId = targetId.trim();
    const cleanDesc = description.trim();

    if (!cleanId) {
      Alert.alert('Missing Target', 'Please provide a valid Target ID (User or Opportunity ID).');
      return;
    }
    if (cleanDesc.length < 5) {
      Alert.alert('Description Too Short', 'Please provide at least 5 characters explaining the incident.');
      return;
    }
    if (cleanDesc.length > 500) {
      Alert.alert('Description Too Long', 'Description cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await reportsService.create({
        targetType,
        targetId: cleanId,
        category,
        description: cleanDesc,
      });

      Alert.alert(
        'Report Filed Confidentially',
        'Thank you for alerting campus moderators. Our safety team reviews all incident reports.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Report Submission Failed', err?.message ?? 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopAppBar
        title="Report Incident"
        showBack
        onBack={() => router.back()}
        showHelp={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Target Context */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Incident Target</Text>

          <View style={styles.targetTypeRow}>
            <TouchableOpacity
              style={[
                styles.targetTypeBtn,
                {
                  backgroundColor: targetType === 'opportunity' ? colors.paidBg : colors.surfaceSecondary,
                  borderColor: targetType === 'opportunity' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTargetType('opportunity')}
            >
              <Text
                style={[
                  styles.targetTypeText,
                  { color: targetType === 'opportunity' ? colors.paidText : colors.onSurfaceVariant },
                ]}
              >
                Opportunity Listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.targetTypeBtn,
                {
                  backgroundColor: targetType === 'user' ? colors.paidBg : colors.surfaceSecondary,
                  borderColor: targetType === 'user' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTargetType('user')}
            >
              <Text
                style={[
                  styles.targetTypeText,
                  { color: targetType === 'user' ? colors.paidText : colors.onSurfaceVariant },
                ]}
              >
                User Account
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.outline }]}>
            Target {targetType === 'opportunity' ? 'Listing' : 'User'} ID:
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                color: colors.onSurface,
              },
            ]}
            placeholder="Paste the ID"
            placeholderTextColor={colors.outline}
            value={targetId}
            onChangeText={setTargetId}
            autoCapitalize="none"
          />
          {params.targetTitle ? (
            <Text style={[styles.targetContext, { color: colors.outline }]}>
              Target context: {params.targetTitle}
            </Text>
          ) : null}
        </View>

        {/* Category Radio Group */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Select Infraction Category
          </Text>

          <View style={styles.categoryList}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryRow,
                    {
                      borderColor: isSelected ? colors.alertText : colors.border,
                      backgroundColor: isSelected ? colors.alertBg : colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, { borderColor: isSelected ? colors.alertText : colors.outline }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.alertText }]} />}
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>{cat.title}</Text>
                    <Text style={[styles.categorySubtitle, { color: colors.outline }]}>{cat.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Incident Details Input */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Explain What Happened <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <Text style={[styles.charCount, { color: colors.outline }]}>{description.length}/500</Text>
          </View>
          <TextInput
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                color: colors.onSurface,
              },
            ]}
            placeholder="Describe what happened"
            placeholderTextColor={colors.outline}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Submit report"
            variant="danger"
            loading={submitting}
            onPress={handleSubmit}
            disabled={submitting}
          />
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  alertHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  alertIcon: { fontSize: 28 },
  alertContent: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertSubtitle: { fontSize: 12, lineHeight: 16 },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  targetTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: 4 },
  targetTypeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  targetTypeText: { fontSize: 12, fontWeight: '600' },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  input: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 13,
  },
  targetContext: { fontSize: 11, fontStyle: 'italic' },
  categoryList: { gap: Spacing.xs, marginTop: 4 },
  categoryRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryInfo: { flex: 1, gap: 2 },
  categoryTitle: { fontSize: 13, fontWeight: '700' },
  categorySubtitle: { fontSize: 11, lineHeight: 15 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 11 },
  textarea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noticeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  noticeTitle: { fontSize: 12, fontWeight: '700' },
  noticeText: { fontSize: 11, lineHeight: 16 },
  actionRow: { gap: Spacing.sm, paddingBottom: Spacing.xl },
});

