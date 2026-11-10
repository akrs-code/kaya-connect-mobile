/**
 * @file assignments/[id]/index.tsx
 * @description Screen 6.2 — Assignment Status & Tracking Workspace.
 *
 * Why: Serves as the central operational cockpit for an active task assignment.
 * It visualizes the 4-phase contract lifecycle (Agreed -> In Progress -> Under Review -> Completed),
 * exposes role-gated state transitions (Start Work, Report Completion, Confirm Completion, Raise Concern),
 * renders counterpart details, and displays the chronological audit log of all contract events.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { assignmentsService } from '@/api/services/assignments.service';
import { AgreementEvent, Assignment, AssignmentStatus } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { Icon } from '@/components/ui/icon';
import { AppShell, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Formats ISO date string to a localized human-readable time format */
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Extracts user ID from ObjectId string or populated user object */
function getEntityId(ref: any): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return ref._id || ref.id || '';
}

/** Displays user full name or fallback label */
function getEntityName(ref: any, fallback: string): string {
  if (!ref) return fallback;
  if (typeof ref === 'object' && ref.fullName) return ref.fullName;
  return fallback;
}

interface StepperProps {
  status: AssignmentStatus;
  colors: ThemeColors;
}

/** Horizontal 4-step contract lifecycle visualization */
function LifecycleStepper({ status, colors }: StepperProps) {
  const isAgreed = ['agreed', 'in_progress', 'completion_pending', 'completed'].includes(status);
  const isInProgress = ['in_progress', 'completion_pending', 'completed'].includes(status);
  const isReview = ['completion_pending', 'completed'].includes(status);
  const isCompleted = status === 'completed';

  const steps = [
    { label: 'Agreed', done: isAgreed, active: status === 'agreed' },
    { label: 'In Progress', done: isInProgress, active: status === 'in_progress' },
    { label: 'Under Review', done: isReview, active: status === 'completion_pending' },
    { label: 'Completed', done: isCompleted, active: status === 'completed' },
  ];

  return (
    <View style={[styles.stepperContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.stepperTrack}>
        <View style={[styles.trackLine, { backgroundColor: colors.border }]} />
      </View>
      <View style={styles.stepsRow}>
        {steps.map((step, idx) => {
          let badgeBg: string = colors.surfaceSecondary;
          let badgeBorder: string = colors.outlineVariant;
          let textColor: string = colors.outline;

          if (step.done) {
            badgeBg = colors.volunteerBg;
            badgeBorder = colors.volunteerText;
            textColor = colors.volunteerText;
          } else if (step.active) {
            badgeBg = colors.primaryContainer;
            badgeBorder = colors.primary;
            textColor = colors.primary;
          }

          return (
            <View key={idx} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  {
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    { color: step.done ? colors.volunteerText : step.active ? colors.onPrimary : colors.outline },
                  ]}
                >
                  {step.done ? '✓' : idx + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: step.active ? colors.primary : textColor,
                    fontWeight: step.active ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AssignmentWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [events, setEvents] = useState<AgreementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [assnData, histData] = await Promise.all([
        assignmentsService.getOne(id),
        assignmentsService.agreementHistory(id).catch(() => []),
      ]);
      setAssignment(assnData);
      setEvents(histData);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load task tracking workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentUserId = user?.id ?? '';
  const isRequester = assignment ? getEntityId(assignment.requester) === currentUserId : false;
  const isProvider = assignment ? getEntityId(assignment.provider) === currentUserId : false;

  /** Transitions agreed assignment to in_progress */
  const handleStartWork = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const updated = await assignmentsService.startWork(id);
      setAssignment(updated);
      Alert.alert('Work Started', 'Task is now officially in progress.');
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message ?? 'Could not start work.');
    } finally {
      setActionLoading(false);
    }
  };

  /** Provider signals completion and requests verification */
  const handleReportCompletion = () => {
    if (!id) return;
    Alert.alert(
      'Report Completion',
      'Have you completed all deliverables specified in the agreed terms?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Report',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await assignmentsService.reportCompletion(id);
              setAssignment(updated);
              Alert.alert('Completion Reported', 'The requester has been notified to verify and release payment.');
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message ?? 'Could not report completion.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  /** Requester verifies completion and marks assignment completed */
  const handleConfirmCompletion = () => {
    if (!id) return;
    Alert.alert(
      'Verify & Complete Task',
      'Confirm that the task deliverables are completely and satisfactorily done?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Finish',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await assignmentsService.confirmCompletion(id);
              setAssignment(updated);
              Alert.alert('Task Completed!', 'Assignment successfully completed and archived.');
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message ?? 'Could not confirm completion.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  /** Requester raises a concern and returns status to in_progress */
  const handleRaiseConcern = () => {
    if (!id) return;
    Alert.alert(
      'Raise Concern',
      'This will rollback the assignment status to In Progress so the provider can address issues.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return to In Progress',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await assignmentsService.raiseConcern(id);
              setAssignment(updated);
              Alert.alert('Returned to In Progress', 'The provider has been requested to revise deliverables.');
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message ?? 'Could not report concern.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  /** Cancels the assignment if in an active non-terminal state */
  const handleCancelAssignment = () => {
    if (!id) return;
    Alert.alert(
      'Cancel Assignment',
      'Are you sure you want to cancel this assignment? This cannot be undone.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel Assignment',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await assignmentsService.cancel(id);
              setAssignment(updated);
              Alert.alert('Cancelled', 'Assignment has been cancelled.');
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message ?? 'Could not cancel assignment.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const oppTitle = assignment
    ? typeof assignment.opportunity === 'object' && assignment.opportunity
      ? assignment.opportunity.title ?? 'Task Assignment'
      : 'Task Assignment'
    : 'Task Assignment';

  const details = assignment?.agreedDetails;
  const isPaid = details?.compensationType === 'paid';
  const compText = isPaid
    ? `₱${Number(details?.compensationAmount ?? 0).toLocaleString()} PHP`
    : 'Volunteer';

  const requesterDisplay = isRequester
    ? `${user?.fullName ?? 'You'} (You)`
    : getEntityName(assignment?.requester, 'Requester');

  const providerDisplay = isProvider
    ? `${user?.fullName ?? 'You'} (You)`
    : getEntityName(assignment?.provider, 'Provider');

  return (
    <AppShell>
      <TopAppBar
        title="Tracking Workspace"
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
          {/* Lifecycle Stepper */}
          <LifecycleStepper status={assignment.status} colors={colors} />

          {/* Task Summary Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isPaid ? colors.paidBg : colors.volunteerBg },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isPaid ? colors.paidText : colors.volunteerText },
                  ]}
                >
                  {isPaid ? 'Paid Task' : 'Volunteer Task'}
                </Text>
              </View>
              <Text style={[styles.compAmount, { color: colors.primary }]}>{compText}</Text>
            </View>

            <Text style={[styles.taskTitle, { color: colors.onSurface }]}>{oppTitle}</Text>

            {details?.location ? (
              <View style={styles.locRow}>
                <Icon name="location_on" size={16} color={colors.outline} />
                <Text style={[styles.locText, { color: colors.outline }]}>{details.location}</Text>
              </View>
            ) : null}

            {/* Counterpart Pair */}
            <View style={[styles.counterpartsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.counterpartItem}>
                <Text style={[styles.roleTag, { color: colors.outline }]}>PROVIDER</Text>
                <Text style={[styles.counterpartName, { color: colors.onSurface }]} numberOfLines={1}>
                  {providerDisplay}
                </Text>
              </View>
              <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
              <View style={styles.counterpartItem}>
                <Text style={[styles.roleTag, { color: colors.outline }]}>REQUESTER</Text>
                <Text style={[styles.counterpartName, { color: colors.onSurface }]} numberOfLines={1}>
                  {requesterDisplay}
                </Text>
              </View>
            </View>

            {/* Communication Action */}
            <TouchableOpacity
              style={[styles.messageBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                if (assignment.conversationId) {
                  router.push(`/messages/${assignment.conversationId}` as any);
                } else {
                  Alert.alert('Conversation unavailable', 'A conversation has not been created for this assignment yet.');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.messageBtnText, { color: colors.primary }]}>💬 Open Messages</Text>
            </TouchableOpacity>
          </View>

          {/* Execution Status & Action Center */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Execution Action Center</Text>

            {/* Status Callout */}
            <View
              style={[
                styles.statusCallout,
                {
                  backgroundColor:
                    assignment.status === 'completed'
                      ? colors.volunteerBg
                      : assignment.status === 'in_progress'
                      ? colors.paidBg
                      : colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusCalloutTitle,
                  {
                    color:
                      assignment.status === 'completed'
                        ? colors.volunteerText
                        : assignment.status === 'in_progress'
                        ? colors.paidText
                        : colors.onSurface,
                  },
                ]}
              >
                Status: {assignment.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={[styles.statusCalloutDesc, { color: colors.onSurfaceVariant }]}>
                {assignment.status === 'awaiting_agreement' &&
                  'The contract terms must be reviewed and mutually agreed upon before starting.'}
                {assignment.status === 'agreed' &&
                  'Both parties have confirmed agreement terms. Work can now begin.'}
                {assignment.status === 'in_progress' &&
                  'Task is active. The provider is currently fulfilling task deliverables.'}
                {assignment.status === 'completion_pending' &&
                  'Provider has reported task completion. Awaiting requester verification.'}
                {assignment.status === 'completed' &&
                  'Task execution is complete and confirmed by both participants.'}
                {assignment.status === 'cancelled' &&
                  'This task assignment has been cancelled.'}
              </Text>
            </View>

            {/* Schedule Window if present */}
            {details?.schedule ? (
              <View style={[styles.scheduleBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.scheduleLabel, { color: colors.outline }]}>Schedule Window</Text>
                <Text style={[styles.scheduleValue, { color: colors.onSurface }]}>
                  {formatDateTime(details.schedule.start)} – {formatDateTime(details.schedule.end)}
                </Text>
              </View>
            ) : null}

            {/* Action Buttons based on Status & Role */}
            <View style={styles.actionGroup}>
              {assignment.status === 'awaiting_agreement' && (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={() => router.push(`/assignments/${id}/agreement` as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                    Review & Confirm Agreement
                  </Text>
                </TouchableOpacity>
              )}

              {assignment.status === 'agreed' && (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={handleStartWork}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                      Start Work 🚀
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {assignment.status === 'in_progress' && isProvider && (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={handleReportCompletion}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                      Report Task Completed ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {assignment.status === 'completion_pending' && isRequester && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.volunteerText }]}
                    onPress={handleConfirmCompletion}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                        Confirm Completed ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { flex: 1, borderColor: colors.border }]}
                    onPress={handleRaiseConcern}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.error }]}>
                      Raise Concern
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {assignment.status === 'completed' && (
                <>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                    onPress={() => router.push(`/assignments/${id}/payment` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                      Payment Acknowledgment
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.border }]}
                    onPress={() => router.push(`/assignments/${id}/review` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                      Leave a Review
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Cancellation trigger for active assignments */}
              {['awaiting_agreement', 'agreed', 'in_progress', 'completion_pending'].includes(
                assignment.status
              ) && (
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={handleCancelAssignment}
                  disabled={actionLoading}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.outline }]}>Cancel Assignment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Activity / Audit Log */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Activity & Audit History</Text>
            {events.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Text style={[styles.emptyText, { color: colors.outline }]}>
                  Contract initiated on {formatDateTime(assignment.createdAt)}.
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {events.map((ev, i) => (
                  <View key={ev._id || i} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineTime, { color: colors.outline }]}>
                        {formatDateTime(ev.createdAt)}
                      </Text>
                      <Text style={[styles.timelineEvent, { color: colors.onSurface }]}>
                        Agreement v{ev.version} {ev.eventType}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Escrow & Campus Safety Protection */}
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: colors.volunteerBg, borderColor: colors.secondaryContainer },
            ]}
          >
            <Text style={[styles.noticeTitle, { color: colors.volunteerText }]}>
              Escrow & Campus Safety Protection Active
            </Text>
            <Text style={[styles.noticeDesc, { color: colors.onSurfaceVariant }]}>
              Mutual verification is enforced by smart state transitions. Please inspect completed work before
              confirming completion.
            </Text>
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
  stepperContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: 25,
    left: 30,
    right: 30,
    height: 2,
    zIndex: 0,
  },
  trackLine: {
    height: 2,
    width: '100%',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontSize: 12,
  },
  counterpartsBox: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginVertical: 4,
  },
  counterpartItem: {
    flex: 1,
    gap: 2,
  },
  roleTag: {
    fontSize: 9,
    fontWeight: '700',
  },
  counterpartName: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerVertical: {
    width: 1,
    marginHorizontal: Spacing.sm,
  },
  messageBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusCallout: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  statusCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCalloutDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  scheduleBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionGroup: {
    gap: Spacing.sm,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 36,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    gap: 1,
  },
  timelineTime: {
    fontSize: 10,
  },
  timelineEvent: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyFeed: {
    paddingVertical: Spacing.xs,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noticeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  noticeDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  retryBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
