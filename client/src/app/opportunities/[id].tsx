/**
 * @file [id].tsx
 * @description Screens 3.3 & 3.4: Opportunity Details View and Application Submission Bottom Sheet.
 * Displays comprehensive task scope, compensation breakdown, campus location, qualifications,
 * and enables direct application submission to `POST /opportunities/:id/applications`.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { opportunitiesService } from '@/api/services/opportunities.service';
import { Application, Opportunity } from '@/api/types';
import { Badge, Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * OpportunityDetailScreen Component
 * 
 * Renders full task details for a selected campus gig or mutual aid opportunity (Screen 3.3)
 * and controls the application proposal submission flow (Screen 3.4).
 * Enforces authenticated submission rules and prevents duplicate applications.
 */
export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user, profile, isAuthenticated } = useAuth();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<Application | null>(null);

  // Application Modal Sheet State (Screen 3.4)
  const [modalVisible, setModalVisible] = useState(false);
  const [pitchMessage, setPitchMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadOpportunity = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await opportunitiesService.getOne(id);
      setOpp(data);

      if (isAuthenticated) {
        const mine = await applicationsService.listMine().catch(() => []);
        const existing = mine.find(
          (a) =>
            (typeof a.opportunity === 'string' ? a.opportunity : a.opportunity?._id) === id &&
            a.status !== 'withdrawn'
        );
        if (existing) {
          setHasApplied(true);
          setMyApplication(existing);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Opportunity not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunity();
  }, [id, isAuthenticated]);

  const handleOpenApplyModal = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setSubmitError('');
    setModalVisible(true);
  };

  const handleSubmitApplication = async () => {
    if (!id) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const app = await applicationsService.apply(id, pitchMessage.trim() || undefined);
      setHasApplied(true);
      setMyApplication(app);
      setModalVisible(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Opportunity Details" showBack onBack={() => router.back()} />
        <View style={styles.centerLoading}>
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading task details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!opp || errorMessage) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Opportunity Details" showBack onBack={() => router.back()} />
        <View style={styles.centerLoading}>
          <Icon name="error" size={36} color={colors.alertText} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>Unable to load listing</Text>
          <Text style={[styles.errorSubtitle, { color: colors.onSurfaceVariant }]}>{errorMessage || 'Listing does not exist'}</Text>
          <Button title="Try again" size="sm" variant="outline" onPress={loadOpportunity} />
          <Button title="Back to Discover" size="sm" onPress={() => router.replace('/')} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  const isVolunteer = opp.opportunityType === 'volunteer' || opp.compensationType === 'unpaid';
  const compAmount = opp.compensationAmount ?? opp.compensation?.amount ?? 0;
  const compUnit = opp.compensationUnit === 'per_hour' ? 'PHP / hour' : 'PHP (Net)';
  const isOwner = user?.id && typeof opp.requester !== 'string' && (opp.requester._id === user.id || opp.requester.id === user.id);
  const canApply = profile?.intent !== 'requester' && opp.status === 'published';

  const requesterName =
    typeof opp.requester === 'object' && opp.requester?.fullName
      ? opp.requester.fullName
      : 'Verified Requester';

  const categoryName =
    typeof opp.category === 'object' && opp.category?.name
      ? opp.category.name
      : typeof opp.category === 'string'
      ? opp.category
      : 'General Campus Task';

  const locationArea =
    typeof opp.location === 'object' && opp.location?.area
      ? opp.location.area
      : typeof opp.location === 'string'
      ? opp.location
      : 'MSU Main Campus';

  const locationAddress =
    typeof opp.location === 'object' && opp.location?.address
      ? opp.location.address
      : '';

  const formatScheduleRange = () => {
    if (!opp.schedule) return 'Flexible Schedule';
    if (typeof opp.schedule === 'string') return opp.schedule;
    try {
      const start = new Date(opp.schedule.start);
      const end = new Date(opp.schedule.end);
      const dayStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dayStr} • ${startStr} - ${endStr}`;
    } catch {
      return 'Scheduled Task';
    }
  };

  const skillsList = opp.qualifications || opp.skillsRequired || [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <TopAppBar
        title="Opportunity Details"
        showBack
        onBack={() => router.back()}
        rightAction={
          <View style={styles.headerActions}>
            {!isOwner ? <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Report listing"
              onPress={() => router.push({
                pathname: '/reports/create' as any,
                params: { targetType: 'opportunity', targetId: opp._id, targetTitle: opp.title },
              })}
              style={styles.headerIconBtn}>
              <Icon name="flag" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity> : null}
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Listing Header & Badges Row */}
        <View style={styles.headerSection}>
          <View style={styles.badgeRow}>
            <Badge
              label={isVolunteer ? 'Volunteer Task' : 'Paid Gig'}
              variant={isVolunteer ? 'volunteer' : 'paid'}
            />
            <View style={[styles.verifiedPill, { backgroundColor: colors.volunteerBg }]}>
              <Icon name="verified_user" size={13} color={colors.secondary} filled />
              <Text style={[styles.verifiedPillText, { color: colors.secondary }]}>
                Campus Verified
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>{opp.title}</Text>

          <View style={styles.metaRow}>
            <Icon name="schedule" size={14} color={colors.outline} />
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              Posted by {requesterName}
            </Text>
          </View>
        </View>

        {/* Compensation Highlight Bento Card */}
        <Card style={styles.bentoCard}>
          <View style={styles.bentoTop}>
            <View>
              <Text style={[styles.bentoLabel, { color: colors.outline }]}>
                OFFERED COMPENSATION
              </Text>
              <Text style={[styles.bentoPrice, { color: colors.primaryContainer }]}>
                {isVolunteer ? 'Volunteer / Civic Aid' : `₱${compAmount}.00`}
                {!isVolunteer && (
                  <Text style={[styles.bentoUnit, { color: colors.onSurfaceVariant }]}>
                    {' '}
                    {compUnit}
                  </Text>
                )}
              </Text>
            </View>

            <View style={[styles.payoutBadge, { backgroundColor: isVolunteer ? colors.volunteerBg : colors.paidBg }]}>
              <Text style={[styles.payoutBadgeText, { color: isVolunteer ? colors.secondary : colors.primary }]}>
                {isVolunteer ? 'Mutual Aid' : 'Guaranteed Payout'}
              </Text>
            </View>
          </View>

          <View style={[styles.bentoNote, { borderTopColor: colors.border }]}>
            <Icon name="check_circle" size={16} color={colors.secondary} filled />
            <Text style={[styles.bentoNoteText, { color: colors.onSurfaceVariant }]}>
              Direct peer payment upon mutual task completion approval. No platform fee.
            </Text>
          </View>
        </Card>

        {/* 2x2 Task Information Grid */}
        <View style={styles.infoGrid}>
          {/* Location */}
          <Card style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <Icon name="location_on" size={16} color={colors.primaryContainer} />
              <Text style={[styles.gridLabel, { color: colors.outline }]}>LOCATION</Text>
            </View>
            <Text style={[styles.gridValue, { color: colors.onSurface }]} numberOfLines={2}>
              {locationArea} {locationAddress ? `\n${locationAddress}` : ''}
            </Text>
          </Card>

          {/* Schedule */}
          <Card style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <Icon name="event" size={16} color={colors.primaryContainer} />
              <Text style={[styles.gridLabel, { color: colors.outline }]}>SCHEDULE</Text>
            </View>
            <Text style={[styles.gridValue, { color: colors.onSurface }]} numberOfLines={2}>
              {formatScheduleRange()}
            </Text>
          </Card>

          {/* Category */}
          <Card style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <Icon name="build" size={16} color={colors.primaryContainer} />
              <Text style={[styles.gridLabel, { color: colors.outline }]}>CATEGORY</Text>
            </View>
            <Text style={[styles.gridValue, { color: colors.onSurface }]} numberOfLines={2}>
              {categoryName}
            </Text>
          </Card>

          {/* Type / Role */}
          <Card style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <Icon name="category" size={16} color={colors.primaryContainer} />
              <Text style={[styles.gridLabel, { color: colors.outline }]}>OPPORTUNITY</Text>
            </View>
            <Text style={[styles.gridValue, { color: colors.onSurface }]}>
              {isVolunteer ? 'Volunteer Service' : 'Student Gig'}
            </Text>
          </Card>
        </View>

        {/* Scope Description Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="description" size={18} color={colors.primaryContainer} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Task Description & Scope
            </Text>
          </View>
          <Text style={[styles.descriptionBody, { color: colors.onSurfaceVariant }]}>
            {opp.description}
          </Text>
        </Card>

        {/* Required Skills & Equipment */}
        {skillsList.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="handyman" size={18} color={colors.primaryContainer} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Required Skills & Qualifications
              </Text>
            </View>

            <View style={styles.skillsWrap}>
              {skillsList.map((skill) => (
                <View
                  key={skill}
                  style={[styles.skillTag, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Icon name="check" size={13} color={colors.primaryContainer} />
                  <Text style={[styles.skillTagText, { color: colors.onSurface }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Requester Identity Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.requesterCardRow}>
            <View style={[styles.requesterAvatar, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.requesterInitial}>
                {requesterName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.requesterCol}>
              <Text style={[styles.requesterTitle, { color: colors.onSurface }]}>
                {requesterName}
              </Text>
            </View>
          </View>
        </Card>

      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomBarContent}>
          {hasApplied ? (
            <View style={[styles.appliedPill, { backgroundColor: colors.volunteerBg, borderColor: colors.secondary }]}>
              <Icon name="check_circle" size={18} color={colors.secondary} filled />
              <Text style={[styles.appliedPillText, { color: colors.secondary }]}>
                Application Submitted ({myApplication?.status.toUpperCase()})
              </Text>
            </View>
          ) : isOwner ? (
            <View style={[styles.appliedPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Icon name="info" size={18} color={colors.outline} />
              <Text style={[styles.appliedPillText, { color: colors.onSurfaceVariant }]}>
                You created this opportunity listing
              </Text>
            </View>
          ) : opp.status !== 'published' ? (
            <View style={[styles.appliedPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Icon name="info" size={18} color={colors.outline} />
              <Text style={[styles.appliedPillText, { color: colors.onSurfaceVariant }]}>This listing is no longer accepting applications.</Text>
            </View>
          ) : !canApply ? (
            <View style={[styles.appliedPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Icon name="info" size={18} color={colors.outline} />
              <Text style={[styles.appliedPillText, { color: colors.onSurfaceVariant }]}>Your poster-only profile cannot apply for tasks.</Text>
            </View>
          ) : (
            <Button
              title="Apply for this Task"
              rightIcon="arrow_forward"
              onPress={handleOpenApplyModal}
              style={{ width: '100%' }}
            />
          )}
        </View>
      </View>

      {/* Screen 3.4: Application Submission Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Drag Handle */}
            <View style={styles.sheetHandleRow}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Apply for Task</Text>
                <Text style={[styles.sheetSub, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {opp.title} ({isVolunteer ? 'Volunteer' : `₱${compAmount}.00 PHP`})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {/* Target Summary Card */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.outline }]}>Requester</Text>
                  <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{requesterName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.outline }]}>Location</Text>
                  <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{locationArea}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.outline }]}>Payout</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryContainer, fontWeight: '700' }]}>
                    {isVolunteer ? 'Volunteer Mutual Aid' : `₱${compAmount}.00 PHP`}
                  </Text>
                </View>
              </View>

              {/* Applicant Profile Snapshot */}
              <View style={[styles.applicantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.applicantName, { color: colors.onSurface }]}>
                  Applying as {user?.fullName || 'Community Member'}
                </Text>
                {profile?.skills && profile.skills.length > 0 && (
                  <View style={styles.matchedSkillsRow}>
                    <Text style={[styles.matchedSkillsLabel, { color: colors.onSurfaceVariant }]}>
                      Profile Skills:
                    </Text>
                    <View style={styles.matchedChipsWrap}>
                      {profile.skills.slice(0, 3).map((sk) => (
                        <View key={sk} style={[styles.matchedChip, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={[styles.matchedChipText, { color: colors.onSurface }]}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Pitch Message / Proposal Field */}
              <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.onSurface }]}>Note (optional)</Text>
                <TextInput
                  style={[
                    styles.textareaInput,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface },
                  ]}
                  placeholder="Briefly explain why you are a good fit"
                  placeholderTextColor={colors.outline}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  value={pitchMessage}
                  onChangeText={setPitchMessage}
                />
              </View>

              {/* Error Banner */}
              {submitError ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
                  <Icon name="error" size={14} color={colors.alertText} />
                  <Text style={[styles.errorBannerText, { color: colors.alertText }]}>
                    {submitError}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Submit Application"
                rightIcon="send"
                loading={submitting}
                onPress={handleSubmitApplication}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setModalVisible(false)}
                style={{ marginTop: Spacing.xs }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerIconBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerActions: {
    flexDirection: 'row',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  errorSubtitle: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: 90,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  bentoCard: {
    marginBottom: Spacing.md,
  },
  bentoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bentoPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  bentoUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  payoutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  payoutBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bentoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  bentoNoteText: {
    fontSize: 12,
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  gridCard: {
    width: '48.5%',
    padding: Spacing.sm,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requesterCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requesterAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requesterInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  requesterCol: {
    flex: 1,
  },
  requesterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  requesterSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  safetyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bottomBarContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  appliedPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Screen 3.4 Modal Styles
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
    maxHeight: '90%',
    paddingBottom: Spacing.md,
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
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetBody: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicantCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  applicantTop: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  applicantBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  applicantName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  matchedSkillsRow: {
    marginTop: 2,
  },
  matchedSkillsLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  matchedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  matchedChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  matchedChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  textareaInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 12,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  radioText: {
    fontSize: 12,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  termsText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  errorBannerText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  sheetFooter: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
});
