/**
 * @file assignments/[id]/agreement.tsx
 * @description Screen 6.1 — Dual Task Agreement Matrix.
 *
 * Why: Before work begins, both requester and provider must independently confirm
 * the same versioned terms (scope, schedule, location, compensation).
 * The backend enforces this via POST /assignments/:id/agreement/accept with
 * { version } — only when BOTH parties have confirmed the same version does
 * the assignment transition from 'awaiting_agreement' to 'agreed'.
 *
 * This screen is shown to the provider (current user) when status is 'awaiting_agreement'
 * and providerConfirmedAt is null. The requester's tile shows confirmed if
 * requesterConfirmedAt is non-null.
 *
 * Stripped: PDF download, document hash, "Legally Binding" label (cosmetic).
 * Stripped: Inline propose form — proposal requires a full form; wire a navigation
 * hint to a future /assignments/:id/propose screen instead.
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
import { Assignment } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { AppShell, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Formats ISO date string as a locale date/time label */
function fmt(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

/** Returns the display name from a populated or raw ID user ref */
function displayName(ref: Assignment['requester']): string {
  if (typeof ref === 'string') return ref.slice(-6);
  return (ref as any)?.fullName ?? '—';
}

interface ConfirmTileProps {
  label: string;
  name: string;
  confirmedAt?: string | null;
  isMe: boolean;
  colors: ThemeColors;
}

function ConfirmTile({ label, name, confirmedAt, isMe, colors }: ConfirmTileProps) {
  const confirmed = !!confirmedAt;
  return (
    <View
      style={[
        styles.tile,
        {
          borderColor: confirmed ? colors.secondaryContainer : colors.warningBg,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <Text style={[styles.tileRole, { color: confirmed ? colors.volunteerText : colors.warningText }]}>
          {label}{isMe ? ' (YOU)' : ''}
        </Text>
        <Text style={{ fontSize: 16 }}>{confirmed ? '✓' : '⏳'}</Text>
      </View>
      <Text style={[styles.tileName, { color: colors.onSurface }]} numberOfLines={1}>
        {name}
      </Text>
      <View
        style={[
          styles.tileStatus,
          { backgroundColor: confirmed ? colors.volunteerBg : colors.warningBg },
        ]}
      >
        <Text
          style={[
            styles.tileStatusText,
            { color: confirmed ? colors.volunteerText : colors.warningText },
          ]}
        >
          {confirmed ? `CONFIRMED ✓` : 'PENDING REVIEW ⏳'}
        </Text>
      </View>
      {confirmed && confirmedAt && (
        <Text style={[styles.tileTime, { color: colors.outline }]}>{fmt(confirmedAt)}</Text>
      )}
      {!confirmed && (
        <Text style={[styles.tileTime, { color: colors.warningText }]}>Awaiting approval</Text>
      )}
    </View>
  );
}

interface TermRowProps {
  number: number;
  title: string;
  value: string;
  note?: string;
  colors: ThemeColors;
}

function TermRow({ number, title, value, note, colors }: TermRowProps) {
  return (
    <View style={[styles.termRow, { borderTopColor: colors.border }]}>
      <Text style={[styles.termTitle, { color: colors.onSurface }]}>
        {number}. {title}
      </Text>
      <Text style={[styles.termValue, { color: colors.onSurfaceVariant }]}>{value}</Text>
      {note ? (
        <Text style={[styles.termNote, { color: colors.outline }]}>{note}</Text>
      ) : null}
    </View>
  );
}

export default function AgreementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentsService.getOne(id);
      setAssignment(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load agreement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isRequester = assignment
    ? (typeof assignment.requester === 'string'
        ? assignment.requester
        : (assignment.requester as any)?._id ?? (assignment.requester as any)?.id) === user?.id
    : false;

  const alreadyConfirmed = isRequester
    ? !!assignment?.requesterConfirmedAt
    : !!assignment?.providerConfirmedAt;

  const canConfirm =
    assignment?.status === 'awaiting_agreement' && !alreadyConfirmed;

  /**
   * Submits POST /assignments/:id/agreement/accept with the current agreementVersion.
   * On success, refreshes the assignment to reflect the updated confirmation state.
   */
  const handleAccept = useCallback(async () => {
    if (!assignment || !canConfirm) return;
    const version = assignment.agreementVersion ?? 1;
    Alert.alert(
      'Confirm Agreement',
      `You are confirming version ${version} of the task terms. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true);
              const updated = await assignmentsService.acceptAgreement(id!, version);
              setAssignment(updated);
              if (updated.status === 'agreed') {
                Alert.alert('Agreement Finalised', 'Both parties have confirmed. You may now start work.', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to accept agreement');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [assignment, canConfirm, id, router]);

  /**
   * Submits POST /assignments/:id/agreement/reject.
   * The assignment stays at awaiting_agreement; the other party must re-propose.
   */
  const handleReject = useCallback(async () => {
    if (!assignment) return;
    const version = assignment.agreementVersion ?? 1;
    Alert.alert(
      'Reject Terms',
      'The requester will be notified to revise the agreement terms.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await assignmentsService.rejectAgreement(id!, version);
              Alert.alert('Rejected', 'Requester has been notified.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to reject agreement');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [assignment, id, router]);

  const d = assignment?.agreedDetails;
  const requesterName = displayName(assignment?.requester ?? '');
  const providerName = displayName(assignment?.provider ?? '');
  const compensationLabel = d?.compensationType === 'paid'
    ? `₱${d.compensationAmount?.toLocaleString() ?? '—'} PHP`
    : 'Volunteer (Unpaid)';
  const scheduleLabel = d?.schedule
    ? `${fmt(d.schedule.start)} – ${fmt(d.schedule.end)}`
    : '—';

  return (
    <AppShell>
      <TopAppBar title="Task Agreement" showBack showHelp={false} />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && assignment && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Task Summary */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {typeof assignment.opportunity === 'string'
                ? 'Task Agreement'
                : (assignment.opportunity as any)?.title ?? 'Task Agreement'}
            </Text>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.outline }]}>Compensation</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>{compensationLabel}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.outline }]}>Agreement Version</Text>
              <Text style={[styles.metaValue, { color: colors.onSurface }]}>v{assignment.agreementVersion ?? 1}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.outline }]}>Status</Text>
              <Text style={[styles.metaValue, { color: colors.onSurface }]}>{assignment.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>

          {/* Dual Confirmation Matrix */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Dual Confirmation Matrix</Text>
            <Text style={[styles.sectionMeta, { color: colors.outline }]}>
              {assignment.requesterConfirmedAt && assignment.providerConfirmedAt ? '2 of 2 Complete' :
               assignment.requesterConfirmedAt || assignment.providerConfirmedAt ? '1 of 2 Complete' :
               '0 of 2 Complete'}
            </Text>
          </View>
          <View style={styles.tileGrid}>
            <ConfirmTile
              label="REQUESTER"
              name={requesterName}
              confirmedAt={assignment.requesterConfirmedAt}
              isMe={isRequester}
              colors={colors}
            />
            <ConfirmTile
              label="PROVIDER"
              name={providerName}
              confirmedAt={assignment.providerConfirmedAt}
              isMe={!isRequester}
              colors={colors}
            />
          </View>

          {/* Mutual Terms */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Mutual Terms</Text>
            {d ? (
              <>
                <TermRow number={1} title="Scope of Work" value={d.description ?? '—'} colors={colors} />
                <TermRow number={2} title="Schedule" value={scheduleLabel} colors={colors} />
                <TermRow number={3} title="Location" value={d.location ?? '—'} colors={colors} />
                <TermRow
                  number={4}
                  title="Compensation"
                  value={compensationLabel}
                  note={d.compensationUnit ? `Paid ${d.compensationUnit.replace('_', ' ')}` : undefined}
                  colors={colors}
                />
              </>
            ) : (
              <Text style={[styles.termValue, { color: colors.outline }]}>
                Terms have not yet been proposed by the requester.
              </Text>
            )}
          </View>

          {/* Honor Code Notice */}
          <View style={[styles.notice, { backgroundColor: colors.volunteerBg, borderColor: colors.secondaryContainer }]}>
            <Text style={[styles.noticeTitle, { color: colors.volunteerText }]}>
              MSU Campus Honor Code Protection
            </Text>
            <Text style={[styles.noticeBody, { color: colors.onSurfaceVariant }]}>
              Both parties must confirm these terms before work begins. Cancellation after mutual lock requires mutual consent or moderator resolution.
            </Text>
          </View>

          <View style={styles.footerPad} />
        </ScrollView>
      )}

      {/* Sticky Footer */}
      {!loading && !error && assignment && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {canConfirm ? (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={handleAccept}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                    Accept & Confirm Agreement ✓
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleReject}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.onSurfaceVariant }]}>
                  Reject Terms
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.disabledNote, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.disabledNoteText, { color: colors.outline }]}>
                {alreadyConfirmed
                  ? 'You have already confirmed these terms. Waiting for the other party.'
                  : assignment.status === 'agreed'
                  ? 'Agreement is finalised. Both parties confirmed.'
                  : `Agreement cannot be confirmed while status is "${assignment.status}".`}
              </Text>
            </View>
          )}
        </View>
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
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 12 },
  metaValue: { fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionMeta: { fontSize: 12 },
  tileGrid: { flexDirection: 'row', gap: Spacing.sm },
  tile: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.md,
    gap: 4,
  },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileRole: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  tileName: { fontSize: 13, fontWeight: '700' },
  tileStatus: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignItems: 'center',
  },
  tileStatusText: { fontSize: 10, fontWeight: '700' },
  tileTime: { fontSize: 10, textAlign: 'center' },
  termRow: { paddingTop: Spacing.sm, borderTopWidth: 1, gap: 2 },
  termTitle: { fontSize: 13, fontWeight: '700' },
  termValue: { fontSize: 13, lineHeight: 18 },
  termNote: { fontSize: 11, fontStyle: 'italic' },
  notice: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeBody: { fontSize: 12, lineHeight: 17 },
  footerPad: { height: 100 },
  footer: {
    borderTopWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  disabledNote: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  disabledNoteText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
});

