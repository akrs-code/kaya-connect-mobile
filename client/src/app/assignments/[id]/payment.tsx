/**
 * @file assignments/[id]/payment.tsx
 * @description Screen 7.1 — Payment Acknowledgment.
 *
 * Why: KayaConnect operates a non-custodial direct peer-to-peer escrow model.
 * Fiat payments (GCash, Maya, Cash) are transferred directly between students.
 * This screen provides a two-phase mutual acknowledgment pipeline:
 * 1. Requester declares payment sent (POST /assignments/:id/payment/declare).
 * 2. Provider confirms funds received (POST /assignments/:id/payment/confirm).
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
import { paymentsService } from '@/api/services/payments.service';
import { Assignment, Payment } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { AppShell, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

/** Formats ISO timestamp to human-friendly string */
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUserId(ref: any): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return ref._id || ref.id || '';
}

function getUserName(ref: any, fallback: string): string {
  if (!ref) return fallback;
  if (typeof ref === 'object' && ref.fullName) return ref.fullName;
  return fallback;
}

export default function PaymentAcknowledgmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [assnData, payData] = await Promise.all([
        assignmentsService.getOne(id),
        paymentsService.get(id),
      ]);
      setAssignment(assnData);
      setPayment(payData);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load payment acknowledgment data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentUserId = user?.id ?? '';
  const isRequester = assignment ? getUserId(assignment.requester) === currentUserId : false;
  const isProvider = assignment ? getUserId(assignment.provider) === currentUserId : false;

  const isDeclared = !!payment?.requesterDeclaredPaidAt;
  const isConfirmed = payment?.status === 'mutually_acknowledged';

  /** Requester declares funds sent */
  const handleDeclare = async () => {
    if (!id) return;
    Alert.alert('Declare payment sent?', `Confirm that you sent ₱${Number(agreedAmount).toLocaleString()} to the provider. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Declare payment',
        onPress: async () => {
          try {
            setActionLoading(true);
            const updated = await paymentsService.declare(id);
            setPayment(updated);
            Alert.alert('Payment Declared', 'The provider has been notified to verify and acknowledge receipt.');
          } catch (err: any) {
            Alert.alert('Declaration Failed', err?.message ?? 'Could not declare payment.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  /** Provider confirms receipt of funds */
  const handleConfirm = async () => {
    if (!id) return;
    Alert.alert('Confirm payment received?', `Confirm that you received ₱${Number(agreedAmount).toLocaleString()}. This acknowledgment cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm receipt',
        onPress: async () => {
          try {
            setActionLoading(true);
            const updated = await paymentsService.confirm(id);
            setPayment(updated);
            Alert.alert('Payment Acknowledged', 'The direct payment has been acknowledged by both participants.');
          } catch (err: any) {
            Alert.alert('Confirmation Failed', err?.message ?? 'Could not confirm receipt.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const oppTitle = assignment
    ? typeof assignment.opportunity === 'object' && assignment.opportunity
      ? assignment.opportunity.title ?? 'Task Assignment'
      : 'Task Assignment'
    : 'Task Assignment';

  const agreedAmount =
    payment?.agreedAmount ?? assignment?.agreedDetails?.compensationAmount ?? 0;

  return (
    <AppShell>
      <TopAppBar
        title="Payment Acknowledgment"
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
          {/* Mutual Progress Pipeline */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.phaseHeader}>
              <Text style={[styles.phaseTitle, { color: colors.onSurfaceVariant }]}>
                Mutual Acknowledgment Phase
              </Text>
              <Text style={[styles.phaseStep, { color: colors.primary }]}>
                {isConfirmed ? 'Step 2 of 2 (Complete)' : isDeclared ? 'Step 2 of 2' : 'Step 1 of 2'}
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primaryContainer,
                    width: isConfirmed ? '100%' : isDeclared ? '50%' : '10%',
                  },
                ]}
              />
            </View>

            <View style={styles.pipelineLabels}>
              <View style={styles.pipelineLabelItem}>
                <Text style={{ fontSize: 13, color: isDeclared ? colors.volunteerText : colors.outline }}>
                  {isDeclared ? '✓ Requester Sent' : '○ Requester Declares'}
                </Text>
              </View>
              <View style={styles.pipelineLabelItem}>
                <Text style={{ fontSize: 13, color: isConfirmed ? colors.volunteerText : colors.outline }}>
                  {isConfirmed ? '✓ Provider Confirmed' : '○ Awaiting Provider'}
                </Text>
              </View>
            </View>
          </View>

          {/* Campus Escrow Notice Banner */}
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: colors.warningBg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.noticeTitle, { color: colors.warningText }]}>
              KayaConnect Campus Peer-to-Peer Escrow Notice
            </Text>
            <Text style={[styles.noticeText, { color: colors.onSurfaceVariant }]}>
              KayaConnect does not directly process fiat or hold banking funds. Payments are made directly
              peer-to-peer (GCash, Maya, or Cash handover) upon satisfactory task completion.
            </Text>
          </View>

          {/* Task Reference Bento Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.paidBg }]}>
                <Text style={[styles.badgeText, { color: colors.paidText }]}>MSU Campus Paid Task</Text>
              </View>
            </View>

            <Text style={[styles.taskTitle, { color: colors.onSurface }]}>{oppTitle}</Text>

            {/* Participants Bar */}
            <View style={[styles.counterpartsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.counterpartItem}>
                <Text style={[styles.roleTag, { color: colors.outline }]}>REQUESTER</Text>
                <Text style={[styles.counterpartName, { color: colors.onSurface }]} numberOfLines={1}>
                  {getUserName(assignment.requester, 'Requester')}
                </Text>
              </View>
              <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
              <View style={styles.counterpartItem}>
                <Text style={[styles.roleTag, { color: colors.outline }]}>PROVIDER</Text>
                <Text style={[styles.counterpartName, { color: colors.onSurface }]} numberOfLines={1}>
                  {getUserName(assignment.provider, 'Provider')}
                </Text>
              </View>
            </View>

            {/* Agreed Direct Compensation Hero */}
            <View style={[styles.heroComp, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.heroLabel, { color: colors.outline }]}>AGREED DIRECT COMPENSATION</Text>
              <Text style={[styles.heroValue, { color: colors.primaryContainer }]}>
                ₱{Number(agreedAmount).toLocaleString()} <Text style={{ fontSize: 16 }}>PHP</Text>
              </Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.volunteerBg }]}>
                <Text style={[styles.pillBadgeText, { color: colors.volunteerText }]}>
                  0% Platform Fee • 100% Peer Payout
                </Text>
              </View>
            </View>
          </View>

          {/* 1. Requester Declaration Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>1. Requester Declaration</Text>
              {isDeclared ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.volunteerBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.volunteerText }]}>Payment Sent ✓</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.warningText }]}>Pending Declaration ⏳</Text>
                </View>
              )}
            </View>

            {isDeclared ? (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.outline }]}>Declared Timestamp:</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                  {formatTime(payment?.requesterDeclaredPaidAt)}
                </Text>
              </View>
            ) : isRequester ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={handleDeclare}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                    Declare Payment Sent
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoText, { color: colors.outline }]}>
                Waiting for the requester to declare that payment was sent.
              </Text>
            )}
          </View>

          {/* 2. Provider Receipt Confirmation Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>2. Provider Receipt Confirmation</Text>
              {isConfirmed ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.volunteerBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.volunteerText }]}>Confirmed Received ✓</Text>
                </View>
              ) : isDeclared ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.warningText }]}>Awaiting Receipt ⏳</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.outline }]}>Locked</Text>
                </View>
              )}
            </View>

            {isConfirmed ? (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.outline }]}>Confirmed Timestamp:</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                  {formatTime(payment?.providerConfirmedReceivedAt)}
                </Text>
              </View>
            ) : isDeclared && isProvider ? (
              <View style={styles.actionColumn}>
                <Text style={[styles.infoText, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>
                  Please check your GCash or bank wallet balance before confirming receipt of funds.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.volunteerText }]}
                  onPress={handleConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                      Confirm Payment Received ✓
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.error }]}
                  onPress={() =>
                    router.push({
                      pathname: '/reports/create' as any,
                      params: {
                        targetType: 'user',
                        targetId: getUserId(assignment.requester),
                        category: 'fraud',
                      },
                    })
                  }
                >
                  <Text style={[styles.outlineBtnText, { color: colors.error }]}>
                    Dispute / Did Not Receive Payment
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.infoText, { color: colors.outline }]}>
                {isDeclared
                  ? 'Waiting for the provider to confirm receipt in their wallet.'
                  : 'Activates once the requester declares payment disbursed.'}
              </Text>
            )}
          </View>

          {/* End-to-end audit note */}
          <View style={styles.footerNote}>
            <Text style={[styles.footerNoteText, { color: colors.outline }]}>
              Payment activity is recorded in your assignment history
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
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseTitle: { fontSize: 13, fontWeight: '600' },
  phaseStep: { fontSize: 12, fontWeight: '700' },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  pipelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pipelineLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeText: { fontSize: 12, lineHeight: 17 },
  badgeRow: { flexDirection: 'row' },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  taskTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  counterpartsBox: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  counterpartItem: { flex: 1, gap: 2 },
  roleTag: { fontSize: 9, fontWeight: '700' },
  counterpartName: { fontSize: 13, fontWeight: '600' },
  dividerVertical: { width: 1, marginHorizontal: Spacing.sm },
  heroComp: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  heroValue: { fontSize: 24, fontWeight: '800' },
  pillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pillBadgeText: { fontSize: 11, fontWeight: '700' },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  metaLabel: { fontSize: 12 },
  metaValue: { fontSize: 12, fontWeight: '600' },
  infoText: { fontSize: 12, fontStyle: 'italic', lineHeight: 16 },
  actionColumn: { gap: Spacing.sm, marginTop: 4 },
  primaryBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    height: 40,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '600' },
  footerNote: { alignItems: 'center', paddingVertical: Spacing.sm },
  footerNoteText: { fontSize: 11 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
});

