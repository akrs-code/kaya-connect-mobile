/**
 * @file admin/moderation.tsx
 * @description Screen 7.4 — Administrative Moderation Queue View.
 *
 * Why: Dedicated administrative workspace for moderators.
 * Renders live incident metrics, filterable priority triage queue (open, under_review, resolved),
 * and enables resolution workflows (under_review, resolve, dismiss, remove listing, suspend user)
 * backed by NestJS AdminController.
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '@/api/services/admin.service';
import { Report, ReportStatus } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AdminBottomTabs } from '@/components/ui/admin-bottom-tabs';
import { TopAppBar } from '@/components/ui/top-app-bar';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Formats ISO date string to concise relative or localized stamp */
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ReportCardProps {
  report: Report;
  colors: ThemeColors;
  onResolve: (id: string, status: 'under_review' | 'resolved' | 'dismissed') => void;
  onRemoveOpportunity?: (id: string) => void;
  onSuspendUser?: (id: string) => void;
}

type ResolutionTarget = {
  id: string;
  status: 'under_review' | 'resolved' | 'dismissed';
};

function ReportCard({
  report,
  colors,
  onResolve,
  onRemoveOpportunity,
  onSuspendUser,
}: ReportCardProps) {
  const isPending = report.status === 'open' || report.status === 'under_review';
  const reporterName =
    typeof report.reporter === 'object' && report.reporter?.fullName
      ? report.reporter.fullName
      : 'Confidential Reporter';

  const targetTitle =
    report.targetType === 'opportunity'
      ? report.target?.title ?? `Listing #${report.targetId.slice(-6)}`
      : report.target?.fullName ?? `User #${report.targetId.slice(-6)}`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                report.status === 'resolved'
                  ? colors.volunteerBg
                  : report.status === 'open'
                  ? colors.alertBg
                  : colors.warningBg,
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color:
                  report.status === 'resolved'
                    ? colors.volunteerText
                    : report.status === 'open'
                    ? colors.alertText
                    : colors.warningText,
              },
            ]}
          >
            {report.status.replace(/_/g, ' ').toUpperCase()} • {report.category.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.outline }]}>
          {formatTime(report.createdAt)}
        </Text>
      </View>

      {/* Target Info */}
      <View style={[styles.targetBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Text style={[styles.targetTypeLabel, { color: colors.outline }]}>
          TARGET {report.targetType.toUpperCase()}:
        </Text>
        <Text style={[styles.targetTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {targetTitle}
        </Text>
        <Text style={[styles.targetSub, { color: colors.outline }]}>
          Reported by {reporterName}
        </Text>
      </View>

      {/* Incident Description */}
      <View style={styles.descWrap}>
        <Text style={[styles.descLabel, { color: colors.outline }]}>INCIDENT DETAILS:</Text>
        <Text style={[styles.descText, { color: colors.onSurface }]}>{report.description}</Text>
      </View>

      {report.note ? (
        <View style={[styles.noteBox, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.noteLabel, { color: colors.outline }]}>Moderator Audit Note:</Text>
          <Text style={[styles.noteText, { color: colors.onSurfaceVariant }]}>{report.note}</Text>
        </View>
      ) : null}

      {/* Moderator Actions */}
      {isPending ? (
        <View style={styles.actionGrid}>
          {report.status === 'open' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={() => onResolve(report._id, 'under_review')}
            >
              <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>
                Mark Under Review
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: colors.volunteerText }]}
              onPress={() => onResolve(report._id, 'resolved')}
            >
              <Text style={[styles.smallBtnText, { color: colors.onPrimary }]}>Resolve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => onResolve(report._id, 'dismissed')}
            >
              <Text style={[styles.smallBtnText, { color: colors.onSurfaceVariant }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>

          {/* Sanction Shortcut */}
          {report.targetType === 'opportunity' && onRemoveOpportunity ? (
            <TouchableOpacity
              style={[styles.sanctionBtn, { borderColor: colors.error }]}
              onPress={() => onRemoveOpportunity(report.targetId)}
            >
              <Text style={[styles.sanctionBtnText, { color: colors.error }]}>
                Remove Reported Listing
              </Text>
            </TouchableOpacity>
          ) : null}

          {report.targetType === 'user' && onSuspendUser ? (
            <TouchableOpacity
              style={[styles.sanctionBtn, { borderColor: colors.error }]}
              onPress={() => onSuspendUser(report.targetId)}
            >
              <Text style={[styles.sanctionBtnText, { color: colors.error }]}>
                Suspend User Account
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function ModerationScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolutionTarget, setResolutionTarget] = useState<ResolutionTarget | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionError, setResolutionError] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listReports({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        limit: 50,
      });
      setReports(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadReports();
    } else {
      setLoading(false);
    }
  }, [user, loadReports]);

  useEffect(() => {
    if (!resolutionTarget || Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !resolving) setResolutionTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resolutionTarget, resolving]);

  const handleResolve = (id: string, status: 'under_review' | 'resolved' | 'dismissed') => {
    setResolutionNote('');
    setResolutionError('');
    setResolutionTarget({ id, status });
  };

  const closeResolution = () => {
    if (resolving) return;
    setResolutionTarget(null);
    setResolutionNote('');
    setResolutionError('');
  };

  const submitResolution = async () => {
    if (!resolutionTarget) return;
    const note = resolutionNote.trim();
    if (note.length < 5) {
      setResolutionError('Enter an administrative note of at least 5 characters.');
      return;
    }
    try {
      setResolving(true);
      setResolutionError('');
      await adminService.resolveReport(resolutionTarget.id, { status: resolutionTarget.status, note });
      setResolutionTarget(null);
      setResolutionNote('');
      setResolutionError('');
      Alert.alert('Report Updated', `Report marked as ${resolutionTarget.status.replace('_', ' ')}.`);
      await loadReports();
    } catch (err: any) {
      setResolutionError(err?.message ?? 'Could not update the report.');
    } finally {
      setResolving(false);
    }
  };

  const handleRemoveOpportunity = (oppId: string) => {
    Alert.alert(
      'Remove Listing',
      'Remove this listing from the marketplace for policy violation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.removeOpportunity(
                oppId,
                'Removed by a moderator following a verified report.'
              );
              Alert.alert('Listing Removed', 'The opportunity has been removed from the platform.');
              loadReports();
            } catch (err: any) {
              Alert.alert('Removal Failed', err?.message ?? 'Could not remove listing.');
            }
          },
        },
      ]
    );
  };

  const handleSuspendUser = (userId: string) => {
    Alert.alert(
      'Suspend User',
      'Suspend this user account for a policy violation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.suspendUser(
                userId,
                'Account suspended by a moderator for a policy violation.'
              );
              Alert.alert('Account Suspended', 'The user account has been suspended.');
              loadReports();
            } catch (err: any) {
              Alert.alert('Suspension Failed', err?.message ?? 'Could not suspend user.');
            }
          },
        },
      ]
    );
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Moderation & Safety" showBack onBack={() => router.back()} showHelp={false} />
        <View style={styles.center}>
          <Icon name="shield" size={44} color={colors.alertText} style={{ marginBottom: Spacing.sm }} />
          <Text style={[styles.restrictedTitle, { color: colors.onSurface }]}>
            Restricted Admin Portal
          </Text>
          <Text style={[styles.restrictedSubtitle, { color: colors.outline }]}>
            The Moderation & Safety Queue is accessible only to authorized administrators.
          </Text>
          <Button
            title={user ? 'Return home' : 'Sign in'}
            variant="outline"
            onPress={() => router.replace(user ? '/' : '/auth/login')}
            style={styles.restrictedAction}
          />
        </View>
      </SafeAreaView>
    );
  }

  const openCount = reports.filter((r) => r.status === 'open').length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="Moderation & Safety"
        showBack
        onBack={() => router.back()}
        showHelp={false}
      />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['open', 'under_review', 'resolved', 'all'] as const).map((tab) => {
          const isSelected = selectedStatus === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceSecondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedStatus(tab)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isSelected ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {tab.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={loadReports} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              colors={colors}
              onResolve={handleResolve}
              onRemoveOpportunity={handleRemoveOpportunity}
              onSuspendUser={handleSuspendUser}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.outline }]}>
                No incidents found under {selectedStatus.replace(/_/g, ' ')}.
              </Text>
            </View>
          }
        />
      )}
      <AdminBottomTabs active="reports" />
      <Modal
        transparent
        visible={Boolean(resolutionTarget)}
        animationType="fade"
        onRequestClose={closeResolution}>
        <Pressable style={styles.modalOverlay} onPress={closeResolution}>
          <Pressable
            accessibilityRole="dialog"
            accessibilityLabel="Resolve report"
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {resolutionTarget ? `Mark report ${resolutionTarget.status.replace('_', ' ')}` : 'Update report'}
              </Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={closeResolution} disabled={resolving} style={styles.modalClose}>
                <Icon name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: colors.onSurfaceVariant }]}>Add a reason for the audit log.</Text>
            <Textarea
              label="Administrative note"
              value={resolutionNote}
              onChangeText={setResolutionNote}
              maxLength={300}
              rows={4}
              autoFocus
              error={resolutionError}
              placeholder="Reason for this action"
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={closeResolution} disabled={resolving} style={styles.modalAction} />
              <Button title="Confirm" loading={resolving} onPress={submitResolution} style={styles.modalAction} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  subHeaderText: { fontSize: 11, fontWeight: '600' },
  adminBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabBtnText: { fontSize: 10, fontWeight: '700' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  timeText: { fontSize: 10 },
  targetBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 2,
  },
  targetTypeLabel: { fontSize: 9, fontWeight: '700' },
  targetTitle: { fontSize: 13, fontWeight: '700' },
  targetSub: { fontSize: 11 },
  descWrap: { gap: 2 },
  descLabel: { fontSize: 9, fontWeight: '700' },
  descText: { fontSize: 12, lineHeight: 17 },
  noteBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 2,
  },
  noteLabel: { fontSize: 9, fontWeight: '700' },
  noteText: { fontSize: 11, fontStyle: 'italic' },
  actionGrid: { gap: Spacing.xs, marginTop: 4 },
  actionBtn: {
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  actionBtnRow: { flexDirection: 'row', gap: Spacing.xs },
  smallBtn: {
    flex: 1,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { fontSize: 11, fontWeight: '700' },
  sanctionBtn: {
    height: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sanctionBtnText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  restrictedTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.xs },
  restrictedSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  restrictedAction: { marginTop: Spacing.sm },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 27, 46, 0.45)', justifyContent: 'center', padding: Spacing.gutter },
  modalCard: { borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md, maxWidth: 480, padding: Spacing.lg, width: '100%', alignSelf: 'center' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  modalClose: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: -Spacing.xs, width: 44 },
  modalDescription: { fontSize: 13, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalAction: { flex: 1 },
});

