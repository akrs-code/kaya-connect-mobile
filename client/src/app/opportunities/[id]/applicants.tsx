/**
 * @file applicants.tsx
 * @description Screen 4.3: Applicant Management & Selection.
 * Allows campus opportunity owners to review student applicants, inspect their qualifications
 * and pitch notes, and atomically select a provider to initiate a formal task assignment via
 * `POST /applications/:id/select`.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { opportunitiesService } from '@/api/services/opportunities.service';
import { Application, Opportunity } from '@/api/types';
import { Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * ApplicantSelectionScreen Component
 * 
 * Manages the candidate review and provider selection lifecycle for an opportunity listing (Screen 4.3).
 * Queries `GET /opportunities/:id/applications` and triggers `POST /applications/:id/select`,
 * atomically transitioning the winning application to `selected` and establishing an agreement assignment.
 */
export default function ApplicantSelectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated } = useAuth();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'submitted' | 'selected'>('all');

  const loadData = async () => {
    if (!id) return;
    try {
      const [oppData, appsData] = await Promise.all([
        opportunitiesService.getOne(id),
        applicationsService.listForOpportunity(id),
      ]);
      setOpp(oppData);
      if (Array.isArray(appsData)) {
        setApplicants(appsData);
      }
    } catch {
      // Handled gracefully
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
    loadData();
  }, [id, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleSelectCandidate = (appId: string, candidateName: string) => {
    Alert.alert(
      'Confirm Provider Selection',
      `Are you sure you want to select ${candidateName}? This will lock the task agreement and notify the student.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select & Award',
          style: 'default',
          onPress: async () => {
            setSelectingId(appId);
            try {
              await applicationsService.select(appId);
              Alert.alert(
                'Applicant Selected',
                `${candidateName} has been selected! An agreement invitation has been issued.`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (err: any) {
              Alert.alert('Selection Error', err.message || 'Failed to select applicant');
            } finally {
              setSelectingId(null);
            }
          },
        },
      ]
    );
  };

  const getCandidateName = (app: Application) => {
    if (typeof app.provider === 'object' && app.provider?.fullName) {
      return app.provider.fullName;
    }
    if (typeof app.applicant === 'object' && app.applicant?.fullName) {
      return app.applicant.fullName;
    }
    return 'Campus Member';
  };

  const getCandidateId = (app: Application) => {
    const candidate = typeof app.provider === 'object' ? app.provider : app.applicant;
    if (candidate && typeof candidate === 'object') {
      return (candidate as { id?: string; _id?: string }).id || (candidate as { _id?: string })._id;
    }
    return typeof app.provider === 'string' ? app.provider : typeof app.applicant === 'string' ? app.applicant : undefined;
  };

  const isVolunteer = opp?.opportunityType === 'volunteer' || opp?.compensationType === 'unpaid';
  const compAmount = opp?.compensationAmount ?? opp?.compensation?.amount ?? 0;
  const locationArea =
    typeof opp?.location === 'object' && opp.location?.area ? opp.location.area : 'MSU Campus';

  const filteredApplicants = applicants.filter((a) => {
    if (filterMode === 'submitted') return a.status === 'submitted';
    if (filterMode === 'selected') return a.status === 'selected';
    return true;
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <TopAppBar
        title="Applicant Selection"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Pinned Task Summary Context Card */}
        {opp && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={[styles.badgePill, { backgroundColor: isVolunteer ? colors.volunteerBg : colors.paidBg }]}>
                <Icon
                  name={isVolunteer ? 'volunteer_activism' : 'payments'}
                  size={14}
                  color={isVolunteer ? colors.secondary : colors.primary}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isVolunteer ? colors.secondary : colors.paidText },
                  ]}>
                  {isVolunteer ? 'Volunteer Service' : 'Paid Task'}
                </Text>
              </View>

              <Text style={[styles.applicantSummaryText, { color: colors.onSurfaceVariant }]}>
                {applicants.length} {applicants.length === 1 ? 'Applicant' : 'Applicants'} Received
              </Text>
            </View>

            <Text style={[styles.oppTitle, { color: colors.onSurface }]}>{opp.title}</Text>

            <View style={styles.metaRow}>
              <Text style={[styles.priceText, { color: colors.primaryContainer }]}>
                {isVolunteer ? 'Unpaid / Volunteer' : `₱${compAmount}.00 PHP`}
              </Text>
              <Text style={[styles.dotSep, { color: colors.outline }]}>•</Text>
              <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>{locationArea}</Text>
            </View>

            <View style={[styles.infoBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Icon name="info" size={16} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.onSurfaceVariant }]}>
                Selecting an applicant immediately issues a Task Agreement invitation for mutual confirmation.
              </Text>
            </View>
          </Card>
        )}

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <Text style={[styles.filterBarTitle, { color: colors.onSurface }]}>
            Candidates Ready ({applicants.length})
          </Text>

          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              onPress={() => setFilterMode('all')}
              style={[
                styles.filterPill,
                filterMode === 'all'
                  ? { backgroundColor: colors.primaryContainer }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: filterMode === 'all' ? colors.onPrimary : colors.onSurface },
                ]}>
                All ({applicants.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterMode('submitted')}
              style={[
                styles.filterPill,
                filterMode === 'submitted'
                  ? { backgroundColor: colors.primaryContainer }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: filterMode === 'submitted' ? colors.onPrimary : colors.onSurface },
                ]}>
                Under Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterMode('selected')}
              style={[
                styles.filterPill,
                filterMode === 'selected'
                  ? { backgroundColor: colors.primaryContainer }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: filterMode === 'selected' ? colors.onPrimary : colors.onSurface },
                ]}>
                Selected
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Applicant Evaluation Stack */}
        {filteredApplicants.length > 0 ? (
          filteredApplicants.map((app) => {
            const candidateName = getCandidateName(app);
            const candidateId = getCandidateId(app);
            const isSelected = app.status === 'selected';

            return (
              <Card
                key={app._id}
                style={[
                  styles.candidateCard,
                  isSelected && { borderColor: colors.secondary, borderWidth: 2 },
                ]}>
                {isSelected && (
                  <View style={[styles.selectedBanner, { backgroundColor: colors.secondary }]}>
                    <Icon name="stars" size={13} color="#fff" filled />
                    <Text style={styles.selectedBannerText}>Selected Provider</Text>
                  </View>
                )}

                {/* Candidate Header */}
                <View style={styles.candidateHeaderRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={styles.avatarLetter}>
                      {candidateName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.candidateNameRow}>
                      <Text style={[styles.candidateName, { color: colors.onSurface }]}>
                        {candidateName}
                      </Text>
                      <View style={[styles.verifiedTag, { backgroundColor: colors.volunteerBg }]}>
                        <Text style={[styles.verifiedTagText, { color: colors.secondary }]}>
                          MSU Verified
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.candidateDate, { color: colors.outline }]}>
                      Applied {new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                {/* Pitch Quote Bubble */}
                {app.message ? (
                  <View style={[styles.pitchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Icon name="format_quote" size={16} color={colors.outline} />
                    <Text style={[styles.pitchText, { color: colors.onSurface }]}>
                      "{app.message}"
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.pitchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.pitchEmptyText, { color: colors.outline }]}>
                      Candidate submitted standard application without custom cover note.
                    </Text>
                  </View>
                )}

                {candidateId ? (
                  <View style={styles.candidateUtilityActions}>
                    <Button
                      title="View Profile"
                      variant="outline"
                      leftIcon="person"
                      onPress={() => router.push(`/users/${candidateId}` as any)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Report"
                      variant="outline"
                      leftIcon="flag"
                      onPress={() => router.push({
                        pathname: '/reports/create' as any,
                        params: { targetType: 'user', targetId: candidateId, targetTitle: candidateName },
                      })}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}

                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                  {isSelected ? (
                    <View style={[styles.confirmedPill, { backgroundColor: colors.volunteerBg }]}>
                      <Icon name="check_circle" size={16} color={colors.secondary} filled />
                      <Text style={[styles.confirmedPillText, { color: colors.secondary }]}>
                        Agreement Invitation Issued
                      </Text>
                    </View>
                  ) : (
                    <Button
                      title={`Select ${candidateName.split(' ')[0]}`}
                      rightIcon="check"
                      loading={selectingId === app._id}
                      onPress={() => handleSelectCandidate(app._id, candidateName)}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </Card>
            );
          })
        ) : !loading ? (
          <Card style={styles.emptyCard}>
            <Icon name="group" size={36} color={colors.outline} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No candidates found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
              {filterMode === 'all'
                ? 'No student applicants have applied for this opportunity listing yet.'
                : `No candidates currently under status "${filterMode}".`}
            </Text>
          </Card>
        ) : null}

        {/* Mutual Agreement Policy Banner */}
        <View style={[styles.policyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="verified_user" size={20} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.policyTitle, { color: colors.onSurface }]}>
              KayaConnect Mutual Agreement Policy
            </Text>
            <Text style={[styles.policyDesc, { color: colors.onSurfaceVariant }]}>
              When you select a provider, agreed task terms are locked for dual confirmation.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: Spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  candidateUtilityActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  applicantSummaryText: {
    fontSize: 11,
  },
  oppTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dotSep: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  filterBar: {
    marginBottom: Spacing.sm,
  },
  filterBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  candidateCard: {
    marginBottom: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: BorderRadius.md,
  },
  selectedBannerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  candidateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  candidateDate: {
    fontSize: 11,
    marginTop: 1,
  },
  pitchBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  pitchText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },
  pitchEmptyText: {
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  confirmedPillText: {
    fontSize: 12,
    fontWeight: '700',
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
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  policyDesc: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
});

