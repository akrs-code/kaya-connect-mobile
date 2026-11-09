/**
 * @file index.tsx
 * @description Screen 3.5: My Applications Tracking.
 * Displays submitted, selected, and completed task applications with live metrics,
 * proposal review, cancellation / withdrawal actions, and opportunity links.
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applicationsService } from '@/api/services/applications.service';
import { Application, Opportunity } from '@/api/types';
import { AppBottomTabs, Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

type StatusFilter = 'all' | 'submitted' | 'selected' | 'withdrawn';

/**
 * MyApplicationsScreen Component
 * 
 * Provides authenticated students and community providers with a comprehensive dashboard
 * to monitor their applied tasks (Screen 3.5).
 * Connects directly to `GET /applications/mine` and `POST /applications/:id/withdraw`.
 */
export default function MyApplicationsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try {
      setError('');
      const data = await applicationsService.listMine();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load your applications. Please try again.');
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
    loadApplications();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
  };

  const handleWithdraw = (appId: string) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw your application for this opportunity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setWithdrawingId(appId);
            try {
              await applicationsService.withdraw(appId);
              await loadApplications();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to withdraw application');
            } finally {
              setWithdrawingId(null);
            }
          },
        },
      ]
    );
  };

  // Compute live metrics from real application records
  const activeCount = applications.filter(
    (a) => a.status === 'submitted' || a.status === 'selected'
  ).length;

  const selectedCount = applications.filter((a) => a.status === 'selected').length;
  const submittedCount = applications.filter((a) => a.status === 'submitted').length;
  const withdrawnCount = applications.filter((a) => a.status === 'withdrawn' || a.status === 'declined').length;

  // Filter items by status tab and text search
  const filteredApps = applications.filter((a) => {
    if (selectedTab === 'submitted' && a.status !== 'submitted') return false;
    if (selectedTab === 'selected' && a.status !== 'selected') return false;
    if (selectedTab === 'withdrawn' && a.status !== 'withdrawn' && a.status !== 'declined') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const opp = typeof a.opportunity === 'object' ? (a.opportunity as Opportunity) : null;
      const title = opp?.title?.toLowerCase() || '';
      const msg = a.message?.toLowerCase() || '';
      return title.includes(q) || msg.includes(q);
    }
    return true;
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <TopAppBar
        title="My Applications"
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
            <Button title="Retry" size="sm" variant="outline" onPress={loadApplications} />
          </View>
        ) : null}
        {/* Quick Metrics Bar (Authentic Live Metrics) */}
        <View style={styles.metricsBar}>
          <Card style={styles.metricCard}>
            <Text numberOfLines={1} style={[styles.metricValue, { color: colors.secondary }]}> 
              {activeCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              Active Apps
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text numberOfLines={1} style={[styles.metricValue, { color: colors.onSurface }]}> 
              {selectedCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              Selected
            </Text>
          </Card>
        </View>

        {/* Search & Filter Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Icon name="search" size={16} color={colors.outline} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search applied tasks..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={16} color={colors.outline} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Segmented Status Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setSelectedTab('all')}
            style={[
              styles.tabBtn,
              selectedTab === 'all'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: selectedTab === 'all' ? colors.onPrimary : colors.onSurface },
              ]}>
              All ({applications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('submitted')}
            style={[
              styles.tabBtn,
              selectedTab === 'submitted'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: selectedTab === 'submitted' ? colors.onPrimary : colors.onSurface },
              ]}>
              Submitted ({submittedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('selected')}
            style={[
              styles.tabBtn,
              selectedTab === 'selected'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: selectedTab === 'selected' ? colors.onPrimary : colors.onSurface },
              ]}>
              Selected ({selectedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('withdrawn')}
            style={[
              styles.tabBtn,
              selectedTab === 'withdrawn'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: selectedTab === 'withdrawn' ? colors.onPrimary : colors.onSurface },
              ]}>
              Withdrawn ({withdrawnCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Applications Feed List */}
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => {
            const opp = typeof app.opportunity === 'object' ? (app.opportunity as Opportunity) : null;
            const oppId = opp?._id || (typeof app.opportunity === 'string' ? app.opportunity : '');
            const title = opp?.title || 'Campus Opportunity';
            const isVolunteer = opp?.opportunityType === 'volunteer' || opp?.compensationType === 'unpaid';
            const compAmount = opp?.compensationAmount ?? opp?.compensation?.amount ?? 0;
            const isSelected = app.status === 'selected';
            const isSubmitted = app.status === 'submitted';
            const isWithdrawn = app.status === 'withdrawn' || app.status === 'declined';

            return (
              <Card
                key={app._id}
                style={[
                  styles.appCard,
                  isSelected && { borderColor: colors.secondary, borderWidth: 1.5 },
                ]}>
                {/* Status Row */}
                <View style={styles.cardStatusRow}>
                  {isSelected ? (
                    <View style={[styles.statusTag, { backgroundColor: colors.volunteerBg }]}>
                      <Icon name="check_circle" size={13} color={colors.secondary} filled />
                      <Text style={[styles.statusTagText, { color: colors.secondary }]}>
                        SELECTED — Awaiting Agreement
                      </Text>
                    </View>
                  ) : isSubmitted ? (
                    <View style={[styles.statusTag, { backgroundColor: colors.paidBg }]}>
                      <Icon name="schedule" size={13} color={colors.primary} />
                      <Text style={[styles.statusTagText, { color: colors.primary }]}>
                        SUBMITTED — Under Review
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.statusTag, { backgroundColor: colors.surfaceSecondary }]}>
                      <Icon name="lock" size={13} color={colors.outline} />
                      <Text style={[styles.statusTagText, { color: colors.onSurfaceVariant }]}>
                        WITHDRAWN / CLOSED
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.dateText, { color: colors.outline }]}>
                    {new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.appTitle, { color: colors.onSurface }]}>{title}</Text>

                {/* Details Box */}
                <View style={[styles.detailsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Compensation</Text>
                    <Text style={[styles.detailValue, { color: colors.primaryContainer }]}>
                      {isVolunteer ? 'Volunteer Mutual Aid' : `₱${compAmount}.00 PHP`}
                    </Text>
                  </View>
                  {app.message && (
                  <View style={[styles.proposalInset, { borderTopColor: colors.border }]}>
                      <Text style={[styles.proposalLabel, { color: colors.outline }]}>Your Pitch Note:</Text>
                      <Text style={[styles.proposalText, { color: colors.onSurface }]} numberOfLines={2}>
                        "{app.message}"
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  {isSelected && app.assignmentId && (
                    <Button
                      title="Open Task"
                      size="sm"
                      leftIcon="assignment"
                      onPress={() => router.push(`/assignments/${app.assignmentId}` as any)}
                      style={{ flex: 1 }}
                    />
                  )}
                  {oppId ? <Button
                    title="View Listing"
                    variant="outline"
                    size="sm"
                    leftIcon="visibility"
                    onPress={() => router.push(`/opportunities/${oppId}`)}
                    style={{ flex: 1 }}
                  /> : null}

                  {isSubmitted && (
                    <Button
                      title="Withdraw"
                      variant="outline"
                      size="sm"
                      loading={withdrawingId === app._id}
                      onPress={() => handleWithdraw(app._id)}
                      style={{ borderColor: colors.alertBg, flex: 0.8 }}
                    />
                  )}
                </View>
              </Card>
            );
          })
        ) : !loading ? (
          <Card style={styles.emptyCard}>
            <Icon name="assignment" size={36} color={colors.outline} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No applications found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              {selectedTab === 'all'
                ? "Browse listings to apply."
                : `You currently have no applications with status "${selectedTab}".`}
            </Text>
            <Button
              title="Explore Gigs"
              size="sm"
              onPress={() => router.replace('/')}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        ) : null}
      </ScrollView>

      <AppBottomTabs active="applications" applicationCount={activeCount} />
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
    paddingBottom: 85,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  metricsBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  errorBanner: { alignItems: 'center', borderRadius: BorderRadius.md, gap: Spacing.sm, marginBottom: Spacing.sm, padding: Spacing.sm },
  errorText: { fontSize: 12, textAlign: 'center' },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  tabsRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appCard: {
    marginBottom: Spacing.md,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  detailsBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  proposalInset: {
    borderTopWidth: 1,
    paddingTop: 4,
    marginTop: 2,
  },
  proposalLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  proposalText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
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
  navIconContainer: {
    position: 'relative',
  },
  badgeBubble: {
    position: 'absolute',
    top: -3,
    right: -8,
    paddingHorizontal: 4,
    height: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
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
  activeIndicator: {
    width: 14,
    height: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  inactiveIndicator: {
    width: 14,
    height: 2,
    marginTop: 2,
  },
});
