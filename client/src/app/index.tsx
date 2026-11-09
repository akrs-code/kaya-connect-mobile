/**
 * @file index.tsx
 * @description Screens 3.1 & 3.2: Opportunity Browse & Search Main Feed with interactive Search Filter Sheet.
 * Provides real-time query filtering, category classification, compensation thresholds,
 * and direct navigation to opportunity details, applications tracking, and user profile.
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
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
import { categoriesService, Category } from '@/api/services/categories.service';
import { opportunitiesService, OpportunityQuery } from '@/api/services/opportunities.service';
import { Opportunity, OpportunityType } from '@/api/types';
import { AppBottomTabs, Badge, Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

type FilterType = 'all' | 'gig' | 'freelance' | 'volunteer' | 'part_time';

interface FilterState {
  type: FilterType;
  compensationType?: 'paid' | 'unpaid';
  category?: string;
  area?: string;
  minAmount?: number;
}

/**
 * HomeScreen Component
 * 
 * Serves as the primary discovery canvas for campus opportunities (Screen 3.1).
 * Connects directly to `GET /opportunities` with full server-side search, category taxonomy,
 * campus location filtering, and houses the interactive Filter Bottom Sheet (Screen 3.2).
 */
export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user, isAuthenticated, logout, sessionError, retrySession } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [activeAreaChip, setActiveAreaChip] = useState<string>('');
  const [myAppsCount, setMyAppsCount] = useState<number>(0);

  // Filter Sheet Modal State (Screen 3.2)
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
  });

  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin/moderation');
  }, [router, user?.role]);

  const loadData = async (queryOverride?: Partial<OpportunityQuery>) => {
    try {
      const q: OpportunityQuery = {
        limit: 20,
        ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
        ...(activeTab !== 'all' ? { type: activeTab as OpportunityType } : {}),
        ...(activeAreaChip ? { area: activeAreaChip } : {}),
        ...queryOverride,
      };

      if (filters.compensationType) {
        q.compensationType = filters.compensationType;
      }
      if (filters.category) {
        q.category = filters.category;
      }
      if (filters.area) {
        q.area = filters.area;
      }

      const [oppsRes, catsRes] = await Promise.all([
        opportunitiesService.list(q),
        categories.length === 0 ? categoriesService.list().catch(() => []) : Promise.resolve(categories),
      ]);

      if (oppsRes && oppsRes.items) {
        let filteredItems = oppsRes.items;
        if (filters.minAmount && filters.minAmount > 0) {
          filteredItems = filteredItems.filter((item) => {
            const amt = item.compensationAmount ?? item.compensation?.amount ?? 0;
            return amt >= filters.minAmount!;
          });
        }
        setOpportunities(filteredItems);
      }

      if (catsRes && catsRes.length > 0 && categories.length === 0) {
        setCategories(catsRes);
      }
    } catch {
      // Offline or network error handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserApplicationsCount = async () => {
    if (!isAuthenticated) return;
    try {
      const apps = await applicationsService.listMine();
      if (Array.isArray(apps)) {
        const activeCount = apps.filter((a) => a.status === 'submitted' || a.status === 'selected').length;
        setMyAppsCount(activeCount);
      }
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    loadData();
    loadUserApplicationsCount();
  }, [activeTab, activeAreaChip]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadUserApplicationsCount();
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    loadData({ q: searchQuery.trim() });
  };

  const handleApplyFilterSheet = () => {
    setFilterModalVisible(false);
    setLoading(true);
    loadData();
  };

  const handleResetFilters = () => {
    setFilters({ type: 'all' });
    setActiveTab('all');
    setActiveAreaChip('');
    setFilterModalVisible(false);
    setLoading(true);
    loadData({ type: undefined, area: undefined, compensationType: undefined, category: undefined });
  };

  const formatSchedule = (schedule?: string | { start: string; end: string }) => {
    if (!schedule) return 'Flexible Campus Schedule';
    if (typeof schedule === 'string') return schedule;
    try {
      const d = new Date(schedule.start);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Scheduled Task';
    }
  };

  const formatLocation = (loc?: string | { area: string; address?: string }) => {
    if (!loc) return 'MSU Main Campus';
    if (typeof loc === 'string') return loc;
    return loc.address ? `${loc.area} (${loc.address})` : loc.area;
  };

  const getRequesterName = (req: string | { fullName: string; [key: string]: any }) => {
    if (!req) return 'Campus Member';
    if (typeof req === 'string') return 'Verified Requester';
    return req.fullName || 'Verified Requester';
  };

  if (user?.role === 'admin') return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={false}
        rightAction={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? 'Log out' : 'Log in'}
            onPress={isAuthenticated ? logout : () => router.push('/auth/login')}
            style={[styles.headerAuthAction, { borderColor: colors.border }]}>
            <Icon name={isAuthenticated ? 'logout' : 'person'} size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.browseControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {sessionError ? (
          <View style={[styles.sessionBanner, { backgroundColor: colors.warningBg }]}> 
            <Text style={[styles.sessionBannerText, { color: colors.warningText }]}>{sessionError}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Retry session" onPress={retrySession}>
              <Text style={[styles.sessionRetryText, { color: colors.warningText }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* Search Bar & Filter Button Row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Icon name="search" size={18} color={colors.outline} />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder="Search gigs, tutoring, repairs..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); loadData({ q: '' }); }}>
                <Icon name="close" size={16} color={colors.outline} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            accessibilityLabel="Filter opportunities"
            onPress={() => setFilterModalVisible(true)}
            style={[styles.filterIconBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Icon name="tune" size={18} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Horizontal Primary Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[
              styles.pillBtn,
              activeTab === 'all'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'all' ? colors.onPrimary : colors.onSurface },
              ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('gig')}
            style={[
              styles.pillBtn,
              activeTab === 'gig'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'gig' ? colors.onPrimary : colors.onSurface },
              ]}>
              Paid Gigs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('volunteer')}
            style={[
              styles.pillBtn,
              activeTab === 'volunteer'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'volunteer' ? colors.onPrimary : colors.onSurface },
              ]}>
              Volunteer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('freelance')}
            style={[
              styles.pillBtn,
              activeTab === 'freelance'
                ? { backgroundColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}>
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'freelance' ? colors.onPrimary : colors.onSurface },
              ]}>
              Freelance
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Quick Chips Sub-filter Bar */}
      <View style={[styles.quickChipsBar, { backgroundColor: colors.canvas, borderBottomColor: colors.border }]}>
        <View style={styles.quickChipsContent}>
          <Text style={[styles.filterPrefix, { color: colors.outline }]}>Filter:</Text>

          <TouchableOpacity
            onPress={() => setActiveAreaChip(activeAreaChip === 'dorms' ? '' : 'dorms')}
            style={[
              styles.subChip,
              activeAreaChip === 'dorms'
                ? { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Icon
              name="near_me"
              size={13}
              color={activeAreaChip === 'dorms' ? colors.onPrimary : colors.primary}
            />
            <Text
              style={[
                styles.subChipText,
                { color: activeAreaChip === 'dorms' ? colors.onPrimary : colors.onSurface },
              ]}>
              Near Me (Dorms)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveAreaChip(activeAreaChip === 'commercial center' ? '' : 'commercial center')}
            style={[
              styles.subChip,
              activeAreaChip === 'commercial center'
                ? { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Icon
              name="storefront"
              size={13}
              color={activeAreaChip === 'commercial center' ? colors.onPrimary : colors.secondary}
            />
            <Text
              style={[
                styles.subChipText,
                { color: activeAreaChip === 'commercial center' ? colors.onPrimary : colors.onSurface },
              ]}>
              Commercial Center
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Area */}
      <ScrollView
        contentContainerStyle={styles.feedScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Feed Meta Count Header */}
        <View style={styles.feedMetaRow}>
          <Text style={[styles.feedCountText, { color: colors.onSurfaceVariant }]}>
            Showing {opportunities.length} active {opportunities.length === 1 ? 'opening' : 'openings'}
          </Text>
        </View>

        {/* Opportunity Card Stream */}
        {opportunities.length > 0 ? (
          opportunities.map((opp) => {
            const isVolunteer = opp.opportunityType === 'volunteer' || opp.compensationType === 'unpaid';
            const compAmount = opp.compensationAmount ?? opp.compensation?.amount ?? 0;
            const compUnit = opp.compensationUnit === 'per_hour' ? '/ hour' : '/ task';
            const requesterName = getRequesterName(opp.requester);
            const skills = opp.qualifications || opp.skillsRequired || [];

            return (
              <Card
                key={opp._id}
                style={styles.oppCard}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push(`/opportunities/${opp._id}`)}>
                  {/* Card Header: Requester Profile & Type Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.requesterMetaRow}>
                      <View style={[styles.requesterAvatar, { backgroundColor: isVolunteer ? colors.volunteerBg : colors.paidBg }]}>
                        <Text style={[styles.requesterInitial, { color: isVolunteer ? colors.secondary : colors.primary }]}>
                          {requesterName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.requesterName, { color: colors.onSurface }]}>
                          {requesterName}
                        </Text>
                        <Text style={[styles.postedTime, { color: colors.outline }]}>
                          Active Campus Listing
                        </Text>
                      </View>
                    </View>

                    <Badge
                      label={isVolunteer ? 'Volunteer' : 'Paid Gig'}
                      variant={isVolunteer ? 'volunteer' : 'paid'}
                    />
                  </View>

                  {/* Title */}
                  <Text style={[styles.oppTitle, { color: colors.onSurface }]}>
                    {opp.title}
                  </Text>

                  {/* Location & Schedule */}
                  <View style={styles.metaInfoCol}>
                    <View style={styles.metaRow}>
                      <Icon name="location_on" size={15} color={colors.outline} />
                      <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                        {formatLocation(opp.location)}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Icon name="schedule" size={15} color={colors.outline} />
                      <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {formatSchedule(opp.schedule)}
                      </Text>
                    </View>
                  </View>

                  {/* Description Snippet */}
                  <Text style={[styles.oppDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                    {opp.description}
                  </Text>

                  {/* Skills Tag Cloud */}
                  {skills.length > 0 && (
                    <View style={styles.skillsTagRow}>
                      {skills.slice(0, 3).map((skill) => (
                        <View
                          key={skill}
                          style={[styles.skillChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                          <Text style={[styles.skillChipText, { color: colors.onSurfaceVariant }]}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Card Footer: Price & Direct CTA */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[styles.compLabel, { color: colors.outline }]}>COMPENSATION</Text>
                      {isVolunteer ? (
                        <Text style={[styles.compAmount, { color: colors.secondary }]}>
                          Volunteer / Civic Aid
                        </Text>
                      ) : (
                        <Text style={[styles.compAmount, { color: colors.primaryContainer }]}>
                          ₱{compAmount}{' '}
                          <Text style={[styles.compUnit, { color: colors.onSurfaceVariant }]}>
                            {compUnit}
                          </Text>
                        </Text>
                      )}
                    </View>

                    <Button
                      title="View Details"
                      rightIcon="arrow_forward"
                      size="sm"
                      onPress={() => router.push(`/opportunities/${opp._id}`)}
                    />
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
        ) : !loading ? (
          <Card style={styles.emptyCard}>
            <Icon name="travel_explore" size={36} color={colors.outline} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No matching listings found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              Try adjusting your search criteria or resetting filters to see available opportunities.
            </Text>
            <Button
              title="Reset Filters"
              variant="outline"
              size="sm"
              onPress={handleResetFilters}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        ) : null}
      </ScrollView>

      {/* Screen 3.2: Filter Bottom Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setFilterModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandleRow}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={handleResetFilters}>
                <Text style={[styles.resetText, { color: colors.onSurfaceVariant }]}>Reset All</Text>
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Filter Opportunities</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="close" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Filter Controls Body */}
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {/* 1. Compensation Type */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                  Compensation & Opportunity Type
                </Text>
                <View style={styles.filterOptionsCol}>
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, compensationType: undefined })}
                    style={[
                      styles.filterRadioRow,
                      {
                        borderColor: !filters.compensationType ? colors.primaryContainer : colors.border,
                        backgroundColor: !filters.compensationType ? colors.surfaceSecondary : colors.surface,
                      },
                    ]}>
                    <Text style={[styles.filterRadioLabel, { color: colors.onSurface }]}>All Opportunities</Text>
                    {!filters.compensationType && (
                      <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, compensationType: 'paid' })}
                    style={[
                      styles.filterRadioRow,
                      {
                        borderColor: filters.compensationType === 'paid' ? colors.primaryContainer : colors.border,
                        backgroundColor: filters.compensationType === 'paid' ? colors.surfaceSecondary : colors.surface,
                      },
                    ]}>
                    <Text style={[styles.filterRadioLabel, { color: colors.onSurface }]}>Paid Gigs Only</Text>
                    {filters.compensationType === 'paid' && (
                      <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, compensationType: 'unpaid' })}
                    style={[
                      styles.filterRadioRow,
                      {
                        borderColor: filters.compensationType === 'unpaid' ? colors.primaryContainer : colors.border,
                        backgroundColor: filters.compensationType === 'unpaid' ? colors.surfaceSecondary : colors.surface,
                      },
                    ]}>
                    <Text style={[styles.filterRadioLabel, { color: colors.onSurface }]}>Volunteer Tasks Only</Text>
                    {filters.compensationType === 'unpaid' && (
                      <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Campus Service Area */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                  Campus Location / Zone
                </Text>
                <View style={styles.pillsWrap}>
                  {['MSU Main Campus', 'Dorms & Residential Halls', 'Commercial Center', 'Marawi City Central'].map(
                    (area) => {
                      const isSel = filters.area === area.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={area}
                          onPress={() =>
                            setFilters({
                              ...filters,
                              area: isSel ? undefined : area.toLowerCase(),
                            })
                          }
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isSel ? colors.primaryContainer : colors.surfaceSecondary,
                              borderColor: isSel ? colors.primaryContainer : colors.border,
                            },
                          ]}>
                          <Text style={[styles.chipOptionText, { color: isSel ? colors.onPrimary : colors.onSurface }]}>
                            {area}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </View>

              {/* 3. Minimum Compensation */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
                  Minimum Compensation (PHP)
                </Text>
                <View style={styles.pillsWrap}>
                  {[0, 300, 500, 1000].map((amt) => {
                    const isSel = (filters.minAmount || 0) === amt;
                    return (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => setFilters({ ...filters, minAmount: amt })}
                        style={[
                          styles.chipOption,
                          {
                            backgroundColor: isSel ? colors.primaryContainer : colors.surfaceSecondary,
                            borderColor: isSel ? colors.primaryContainer : colors.border,
                          },
                        ]}>
                        <Text style={[styles.chipOptionText, { color: isSel ? colors.onPrimary : colors.onSurface }]}>
                          {amt === 0 ? 'Any Amount' : `₱${amt}+`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Apply Filters"
                rightIcon="arrow_forward"
                onPress={handleApplyFilterSheet}
              />
            </View>
          </View>
        </View>
      </Modal>

      <AppBottomTabs active="browse" applicationCount={myAppsCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  browseControls: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sessionBanner: { alignItems: 'center', borderRadius: BorderRadius.md, flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between', marginBottom: Spacing.sm, padding: Spacing.sm },
  sessionBannerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  sessionRetryText: { fontSize: 12, fontWeight: '700', padding: Spacing.xs },
  headerAuthAction: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillsScroll: {
    gap: Spacing.xs,
  },
  pillBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickChipsBar: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 6,
  },
  quickChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterPrefix: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  subChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  feedScroll: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: 85,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  feedMetaRow: {
    marginBottom: Spacing.sm,
  },
  feedCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  oppCard: {
    marginBottom: Spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  requesterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  requesterAvatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requesterInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  requesterName: {
    fontSize: 13,
    fontWeight: '600',
  },
  postedTime: {
    fontSize: 10,
  },
  oppTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metaInfoCol: {
    gap: 2,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  oppDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  skillsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  skillChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  compLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  compUnit: {
    fontSize: 11,
    fontWeight: '400',
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
  // Modal Bottom Sheet (Screen 3.2)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.lg,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: BorderRadius.full,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetBody: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  filterOptionsCol: {
    gap: Spacing.xs,
  },
  filterRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  filterRadioLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chipOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  chipOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sheetFooter: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
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
  centerFabContainer: {
    alignItems: 'center',
    marginTop: -16,
    flex: 1,
  },
  centerFab: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
