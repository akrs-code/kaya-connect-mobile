/**
 * @file assignments/[id]/review.tsx
 * @description Screen 7.2 — Post-Task Mutual Review Modal.
 *
 * Why: Reviews preserve feedback linked to completed assignments.
 * Submits rating (1 to 5) and feedback comment (max 500 chars) to POST /assignments/:id/reviews.
 * Backend assigns the review to the counterpart automatically based on the caller's role.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { assignmentsService } from '@/api/services/assignments.service';
import { reviewsService } from '@/api/services/reviews.service';
import { Assignment } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { AppShell, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export default function ReviewModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentsService.getOne(id);
      setAssignment(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load assignment details for review');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentUserId = user?.id ?? '';
  const isRequester = assignment
    ? (typeof assignment.requester === 'object'
        ? (assignment.requester as any)?._id || (assignment.requester as any)?.id
        : assignment.requester) === currentUserId
    : false;

  const counterpartRole = isRequester ? 'Provider' : 'Requester';
  const counterpartName = assignment
    ? isRequester
      ? typeof assignment.provider === 'object' && (assignment.provider as any)?.fullName
        ? (assignment.provider as any).fullName
        : 'Provider'
      : typeof assignment.requester === 'object' && (assignment.requester as any)?.fullName
      ? (assignment.requester as any).fullName
      : 'Requester'
    : 'Counterpart';

  const handleSubmit = async () => {
    if (!id) return;
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setSubmitting(true);
      await reviewsService.create(id, {
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Review Submitted', 'Thank you for keeping the MSU campus community accountable!', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopAppBar
        title="Rate Your Experience"
        showBack
        onBack={() => router.back()}
        showHelp={false}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !assignment ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error ?? 'Assignment not found'}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header context */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.taskLabel, { color: colors.outline }]}>COMPLETED TASK</Text>
            <Text style={[styles.taskTitle, { color: colors.onSurface }]}>
              {typeof assignment.opportunity === 'object' && assignment.opportunity
                ? assignment.opportunity.title ?? 'Task Assignment'
                : 'Task Assignment'}
            </Text>

            <View style={[styles.counterpartBox, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {counterpartName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.counterpartInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.counterpartName, { color: colors.onSurface }]} numberOfLines={1}>
                    {counterpartName}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: colors.paidBg }]}>
                    <Text style={[styles.roleBadgeText, { color: colors.paidText }]}>{counterpartRole}</Text>
                  </View>
                </View>
                <Text style={[styles.counterpartSub, { color: colors.outline }]}>Reviewing your task counterpart</Text>
              </View>
            </View>
          </View>

          {/* Interactive Star Rating */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
            <Text style={[styles.starHeading, { color: colors.outline }]}>OVERALL RATING</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.starIcon, { color: star <= rating ? '#FFB300' : colors.outlineVariant }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingLabel, { color: colors.onSurface }]}>
              {rating === 5 && 'Excellent'}
              {rating === 4 && 'Good'}
              {rating === 3 && 'Okay'}
              {rating === 2 && 'Needs improvement'}
              {rating === 1 && 'Poor'}
            </Text>
          </View>

          {/* Detailed Comments Textarea */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.commentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Comment (optional)
              </Text>
              <Text style={[styles.charCount, { color: colors.outline }]}>{comment.length}/500</Text>
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
              placeholder="Share helpful feedback"
              placeholderTextColor={colors.outline}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Action CTAs */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                  Submit review
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={() => router.back()}
              disabled={submitting}
            >
              <Text style={[styles.skipBtnText, { color: colors.onSurfaceVariant }]}>
                Skip for Now
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  taskLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  taskTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  counterpartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  counterpartInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  counterpartName: { fontSize: 14, fontWeight: '700' },
  roleBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '700' },
  counterpartSub: { fontSize: 11 },
  starHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  starRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.xs },
  starTouch: { padding: 4 },
  starIcon: { fontSize: 36 },
  ratingLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 11 },
  textarea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionRow: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  primaryBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  skipBtn: {
    height: 40,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
});

