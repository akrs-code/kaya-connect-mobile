/**
 * @file index.tsx
 * @description Screen 2.1: User Profile View.
 * Displays user identity, verified skills, biography, portfolio carousel,
 * and authentic community reviews connected to the backend.
 */

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { usersService } from '@/api/services/users.service';
import { AppShell, Button, Card, Icon } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * ProfileScreen Component
 * 
 * Renders the authentic profile view for the logged-in user or public member.
 * Loads verified completed tasks, peer reviews, portfolio work samples, and
 * active campus service areas from NestJS endpoints (`GET /users/:id/profile`,
 * `GET /users/:id/reviews`, `GET /users/:id/history`).
 */
export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user, profile, refreshProfile } = useAuth();

  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    tasksDone: number;
    rating: number | null;
    reviewCount: number;
  }>({
    tasksDone: 0,
    rating: null,
    reviewCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const loadUserData = async () => {
    if (!user?.id) return;
    try {
      const [reviewData, historyData, publicProfile] = await Promise.all([
        usersService.getReviews(user.id),
        usersService.getHistory(user.id),
        usersService.getPublicProfile(user.id),
      ]);

      if (reviewData?.items) {
        setReviews(reviewData.items);
      }

      const avgRating = publicProfile?.reviewSummary?.averageRating ?? null;
      const revCount = publicProfile?.reviewSummary?.totalReviews ?? (reviewData?.total || 0);

      setStats({
        tasksDone: Array.isArray(historyData) ? historyData.length : 0,
        rating: avgRating,
        reviewCount: revCount,
      });
      setActivityError(null);
    } catch {
      setActivityError('Could not update tasks and reviews.');
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  useFocusEffect(React.useCallback(() => {
    loadUserData();
  }, [user?.id]));

  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin/moderation');
  }, [router, user?.role]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadUserData()]);
    setRefreshing(false);
  };

  const displayName = user?.fullName || 'Community Member';
  const serviceArea = profile?.serviceArea?.[0] || 'MSU Main Campus Area';
  const bio = profile?.biography || 'No self-introduction added yet. Tap edit profile to customize.';
  const skills = profile?.skills || [];
  const portfolio = profile?.portfolio || [];
  const taskActionLabel = profile?.intent === 'requester'
    ? 'My Requests'
    : profile?.intent === 'both'
      ? 'Work & Requests'
      : 'My Work';

  if (user?.role === 'admin') return null;

  return (
    <AppShell
      header={{ title: 'User Profile', showBack: true, onBack: () => (router.canGoBack() ? router.back() : router.replace('/')) }}
      activeTab="profile">

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Profile Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            {/* Avatar Circle with Initial */}
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryContainer, borderColor: colors.surface }]}>
              {user?.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : (
                <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </View>

            {/* Name & Verification */}
            <View style={styles.nameRow}>
              <Text style={[styles.fullName, { color: colors.onSurface }]}>{displayName}</Text>
            </View>

            {/* Campus Service Area */}
            <View style={styles.affiliationRow}>
              <Icon name="location_on" size={16} color={colors.primary} />
              <Text style={[styles.affiliationText, { color: colors.onSurfaceVariant }]}>
                {serviceArea}
              </Text>
            </View>
            <View style={styles.profileActions}>
              <Button title={taskActionLabel} variant="outline" leftIcon="assignment" onPress={() => router.push('/assignments' as any)} style={styles.profileAction} />
              <Button title="Edit Profile" leftIcon="edit" onPress={() => router.push('/profile/edit')} style={styles.profileAction} />
            </View>
          </View>
        </Card>

        {activityError ? (
          <View style={[styles.activityError, { backgroundColor: colors.alertBg }]}> 
            <Text style={[styles.activityErrorText, { color: colors.alertText }]}>{activityError}</Text>
            <Button title="Retry" size="sm" variant="outline" onPress={loadUserData} />
          </View>
        ) : null}

        {/* Real Stats Bar (Tasks Done & Verified Reviews) */}
        <View style={[styles.metricsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Tasks Done */}
          <View style={[styles.metricCol, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
            <View style={styles.metricValRow}>
              <Icon name="task_alt" size={16} color={colors.primary} />
              <Text style={[styles.metricNumber, { color: colors.onSurface }]}>{stats.tasksDone}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Tasks Completed</Text>
          </View>

          {/* Average Rating */}
          <View style={[styles.metricCol, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
            <View style={styles.metricValRow}>
              <Icon name="star" size={16} color="#FFB300" filled />
              <Text style={[styles.metricNumber, { color: colors.onSurface }]}>
                {stats.rating !== null ? stats.rating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              {stats.reviewCount > 0 ? `${stats.reviewCount} Reviews` : 'No Reviews Yet'}
            </Text>
          </View>
        </View>

        {/* Bio Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Icon name="badge" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>About</Text>
            </View>
          </View>
          <Text style={[styles.bioText, { color: colors.onSurfaceVariant }]}>{bio}</Text>
        </Card>

        {/* Skills Tag Grid */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Icon name="psychology" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Skills & Services
              </Text>
            </View>
            <Text style={[styles.skillsCountBadge, { color: colors.primary }]}>
              {skills.length}
            </Text>
          </View>

          {skills.length > 0 ? (
            <View style={styles.skillsWrap}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[
                    styles.skillTag,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Icon name="check" size={14} color={colors.primary} />
                  <Text style={[styles.skillTagText, { color: colors.onSurface }]}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyPromptText, { color: colors.outline }]}>
              No skills added yet. Tap Edit Profile to add skills.
            </Text>
          )}
        </Card>

        {/* Portfolio Carousel Section */}
        {portfolio.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Icon name="folder_special" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Portfolio & Deliverables
                </Text>
              </View>
              <Text style={[styles.portfolioCount, { color: colors.primary }]}>
                {portfolio.length}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
              {portfolio.map((item, index) => (
                <View
                  key={item._id || index}
                  style={[styles.portfolioItem, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
                  <Image source={{ uri: item.imageUrl }} style={styles.portfolioThumb} />
                  <View style={styles.portfolioMeta}>
                    <Text style={[styles.portfolioItemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.portfolioItemDesc, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Community Reviews Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Icon name="rate_review" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Community Feedback</Text>
            </View>
          </View>

          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((rev) => (
                <View key={rev._id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewerName, { color: colors.onSurface }]}>
                      {rev.reviewer?.fullName || 'Verified Peer'}
                    </Text>
                    <View style={styles.starsRow}>
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Icon key={i} name="star" size={14} color="#FFB300" filled />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: colors.onSurfaceVariant }]}>
                    {rev.comment}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyPromptText, { color: colors.outline }]}>
              No reviews received yet. Reviews appear once completed tasks are evaluated.
            </Text>
          )}
        </Card>
      </ScrollView>

    </AppShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: 85,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  headerCardContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: BorderRadius.full },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
  },
  affiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  affiliationText: {
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricCol: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  skillsCountBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  portfolioCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  portfolioScroll: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  portfolioItem: {
    width: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  portfolioThumb: {
    width: '100%',
    height: 100,
  },
  portfolioMeta: {
    padding: Spacing.xs + 2,
  },
  portfolioItemTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  portfolioItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  reviewsList: {
    gap: Spacing.sm,
  },
  reviewItem: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyPromptText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  profileActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  profileAction: {
    flex: 1,
  },
  activityError: { alignItems: 'center', borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.md, padding: Spacing.sm },
  activityErrorText: { fontSize: 13, textAlign: 'center' },
});
