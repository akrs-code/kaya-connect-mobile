/**
 * @file mine.tsx
 * @description Screen 4.2: My Listings Dashboard.
 * Allows campus requesters to manage their published, in-progress, and draft opportunities,
 * inspect applicant counts, transition to applicant selection, and create new task postings.
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applicationsService } from '@/api/services/applications.service';
import { assignmentsService } from '@/api/services/assignments.service';
import { opportunitiesService } from '@/api/services/opportunities.service';
import { Assignment, Opportunity } from '@/api/types';
import { AppBottomTabs, Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

type StatusTab = 'all' | 'published' | 'assigned' | 'closed' | 'draft';

/**
 * MyListingsScreen Component
 * 
 * Provides an administrative dashboard for campus requesters to monitor their posted tasks (Screen 4.2).
 * Connects directly to `GET /opportunities/mine` and `POST /opportunities/:id/close`.
 */
export default function MyListingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated } = useAuth();

  const [listings, setListings] = useState<Opportunity[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [assignmentIds, setAssignmentIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<StatusTab>('all');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadListings = async () => {
    try {
      setError('');
      const [items, assignments] = await Promise.all([
        opportunitiesService.mine(),
        assignmentsService.listMine(),
      ]);
      if (Array.isArray(items)) {
        setListings(items);
        const byOpportunity = (assignments as Assignment[]).reduce<Record<string, string>>((result, assignment) => {
          const opportunityId = typeof assignment.opportunity === 'string'
            ? assignment.opportunity
            : assignment.opportunity?._id;
          if (opportunityId) result[opportunityId] = assignment._id;
          return result;
        }, {});
        setAssignmentIds(byOpportunity);

        // Fetch applicants count for each active listing in parallel
        const counts: Record<string, number> = {};
        await Promise.all(
          items.map(async (opp) => {
            try {
              const apps = await applicationsService.listForOpportunity(opp._id);
              counts[opp._id] = apps.length;
            } catch {
              counts[opp._id] = 0;
            }
          })
        );
        setApplicantCounts(counts);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load your listings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadListings();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
  };

  const handleCloseListing = (oppId: string, title: string) => {
    Alert.alert(
      'Close Opportunity Listing',
      `Are you sure you want to close "${title}"? It will no longer accept new student applicants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Listing',
          style: 'destructive',
          onPress: async () => {
            setClosingId(oppId);
            try {
              await opportunitiesService.close(oppId);
              await loadListings();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to close opportunity');
            } finally {
              setClosingId(null);
            }
          },
        },
      ]
    );
  };

  // Live Metrics Calculation
  const activeCount = listings.filter((l) => l.status === 'published').length;
  const inProgressCount = listings.filter((l) => l.status === 'assigned').length;
  const completedCount = listings.filter((l) => l.status === 'closed').length;
  const draftCount = listings.filter((l) => l.status === 'draft').length;

  // Filter listings by current tab
  const filteredListings = listings.filter((l) => {
    if (selectedTab === 'published') return l.status === 'published';
    if (selectedTab === 'assigned') return l.status === 'assigned';
    if (selectedTab === 'closed') return l.status === 'closed';
    if (selectedTab === 'draft') return l.status === 'draft';
    return true;
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <TopAppBar
        title="My Posted Listings"
        showBack
        onBack={() => router.replace('/')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
            <Text style={[styles.errorText, { color: colors.alertText }]}>{error}</Text>
            <Button title="Retry" size="sm" variant="outline" onPress={loadListings} />
          </View>
        ) : null}
        {/* Hero Header Row */}
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>My listings</Text>
            <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>Manage tasks and applicants.</Text>
          </View>

          <Button
            title="Post Task"
            leftIcon="add"
            size="sm"
            onPress={() => router.push('/opportunities/create')}
          />
        </View>

        {/* 3-Column Live Metrics Summary Bar */}
        <View style={styles.metricsBar}>
          <Card style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricOverline, { color: colors.onSurfaceVariant }]}>ACTIVE</Text>
              <View style={[styles.statusDot, { backgroundColor: colors.primaryContainer }]} />
            </View>
            <Text numberOfLines={1} style={[styles.metricValue, { color: colors.onSurface }]}>{activeCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Live Listings</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricOverline, { color: colors.onSurfaceVariant }]}>ASSIGNED</Text>
              <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
            </View>
            <Text numberOfLines={1} style={[styles.metricValue, { color: colors.onSurface }]}>{inProgressCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>In Progress</Text>
          </Card>

        </View>

        {/* Status Filter Segmented Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setSelectedTab('all')}
            style={[
              styles.tabPill,
              selectedTab === 'all'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabPillText,
                { color: selectedTab === 'all' ? colors.onPrimary : colors.onSurface },
              ]}>
              All ({listings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('published')}
            style={[
              styles.tabPill,
              selectedTab === 'published'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabPillText,
                { color: selectedTab === 'published' ? colors.onPrimary : colors.onSurface },
              ]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('assigned')}
            style={[
              styles.tabPill,
              selectedTab === 'assigned'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabPillText,
                { color: selectedTab === 'assigned' ? colors.onPrimary : colors.onSurface },
              ]}>
              In Progress ({inProgressCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('closed')}
            style={[
              styles.tabPill,
              selectedTab === 'closed'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabPillText,
                { color: selectedTab === 'closed' ? colors.onPrimary : colors.onSurface },
              ]}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('draft')}
            style={[
              styles.tabPill,
              selectedTab === 'draft'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabPillText,
                { color: selectedTab === 'draft' ? colors.onPrimary : colors.onSurface },
              ]}>
              Drafts ({draftCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Listings Feed Cards */}
        {filteredListings.length > 0 ? (
          filteredListings.map((opp) => {
            const isVolunteer = opp.opportunityType === 'volunteer' || opp.compensationType === 'unpaid';
            const compAmount = opp.compensationAmount ?? opp.compensation?.amount ?? 0;
            const count = applicantCounts[opp._id] ?? 0;
            const assignmentId = assignmentIds[opp._id];
            const locationArea =
              typeof opp.location === 'object' && opp.location?.area ? opp.location.area : 'MSU Campus';

            return (
              <Card key={opp._id} style={styles.listingCard}>
                {/* Header Row: Badge & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgeWrap}>
                    <View style={[styles.typeBadge, { backgroundColor: isVolunteer ? colors.volunteerBg : colors.paidBg }]}>
                      <Text style={[styles.typeBadgeText, { color: isVolunteer ? colors.secondary : colors.paidText }]}>
                        {isVolunteer ? 'Volunteer' : 'Paid Gig'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.onSurfaceVariant }]}>
                        {opp.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.createdDate, { color: colors.outline }]}>
                    {new Date(opp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.listingTitle, { color: colors.onSurface }]}>{opp.title}</Text>

                {/* Location & Compensation */}
                <View style={styles.listingMetaCol}>
                  <View style={styles.metaItem}>
                    <Icon name="location_on" size={15} color={colors.outline} />
                    <Text style={[styles.metaItemText, { color: colors.onSurfaceVariant }]}>
                      {locationArea}
                    </Text>
                  </View>

                  <Text style={[styles.compText, { color: colors.primaryContainer }]}>
                    {isVolunteer ? 'Volunteer Service' : `₱${compAmount}.00 PHP`}
                  </Text>
                </View>

                {/* Applicant Highlight Inset Banner */}
                {opp.status === 'published' && (
                  <View style={[styles.applicantBanner, { backgroundColor: colors.paidBg, borderColor: colors.border }]}>
                    <View style={styles.applicantBannerLeft}>
                      <Icon name="groups" size={18} color={colors.primary} filled />
                      <Text style={[styles.applicantCountText, { color: colors.paidText }]}>
                        {count} {count === 1 ? 'Applicant' : 'Applicants'} Received
                      </Text>
                    </View>
                    {count > 0 && (
                      <View style={[styles.needsReviewPill, { backgroundColor: colors.primaryContainer }]}>
                        <Text style={[styles.needsReviewText, { color: colors.onPrimary }]}>Review</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons Row */}
                <View style={[styles.cardActionsRow, { borderTopColor: colors.border }]}>
                  {assignmentId ? (
                    <Button
                      title="Open Task"
                      rightIcon="arrow_forward"
                      size="sm"
                      onPress={() => router.push(`/assignments/${assignmentId}` as any)}
                      style={{ flex: 1 }}
                    />
                  ) : opp.status === 'published' && count > 0 ? (
                    <Button
                      title={`Review Applicants (${count})`}
                      rightIcon="arrow_forward"
                      size="sm"
                      onPress={() => router.push(`/opportunities/${opp._id}/applicants`)}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <Button
                      title="View Details"
                      variant="outline"
                      size="sm"
                      onPress={() => router.push(`/opportunities/${opp._id}`)}
                      style={{ flex: 1 }}
                    />
                  )}

                  {['draft', 'published'].includes(opp.status) ? <TouchableOpacity
                    accessibilityLabel="Edit Listing"
                    onPress={() => router.push(`/opportunities/create?id=${opp._id}`)}
                    style={[styles.iconActionBtn, { borderColor: colors.border }]}>
                    <Icon name="edit" size={17} color={colors.onSurfaceVariant} />
                  </TouchableOpacity> : null}

                  {opp.status === 'published' && (
                    <TouchableOpacity
                      accessibilityLabel="Close Listing"
                      disabled={closingId === opp._id}
                      onPress={() => handleCloseListing(opp._id, opp.title)}
                      style={[styles.iconActionBtn, { borderColor: colors.alertBg }]}>
                      <Icon name="cancel" size={17} color={colors.alertText} />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        ) : !loading ? (
          <Card style={styles.emptyCard}>
            <Icon name="post_add" size={36} color={colors.outline} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No listings in this view</Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              Post a task to start receiving applications.
            </Text>
            <Button
              title="Post task"
              leftIcon="add"
              size="sm"
              onPress={() => router.push('/opportunities/create')}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        ) : null}
      </ScrollView>

      <AppBottomTabs active="listings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: 90,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  errorBanner: { alignItems: 'center', borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.sm, padding: Spacing.sm },
  errorText: { fontSize: 12, textAlign: 'center' },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  metricsBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.sm,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metricOverline: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  tabsRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listingCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  createdDate: {
    fontSize: 11,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  listingMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 12,
  },
  compText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applicantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: Spacing.xs,
  },
  applicantBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  needsReviewPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  needsReviewText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
    marginTop: 4,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  // Sticky Bottom Navigation Bar
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  floatingFabWrap: {
    alignItems: 'center',
    marginTop: -18,
  },
  floatingFab: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
