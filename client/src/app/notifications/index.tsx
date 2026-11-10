/**
 * @file notifications/index.tsx
 * @description Screen 5.1 — In-App Notifications & Activity Center.
 *
 * Why: Surfaces the user's recent 50 notifications (GET /notifications) with
 * a "Mark all read" action that batches PATCH /notifications/:id/read per unread item.
 * No backend mark-all-read endpoint exists, so we iterate client-side.
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { notificationsService } from '@/api/services/notifications.service';
import { Notification } from '@/api/types';
import { Icon } from '@/components/ui/icon';
import { AppShell, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Human-readable label derived from the backend notification type string */
function typeLabel(type: string): string {
  const map: Record<string, string> = {
    'application.new': 'New Application',
    'payment.declared': 'Payment Declared',
    'payment.confirmed': 'Payment Confirmed',
    'review.new': 'New Review',
    'message.new': 'New Message',
  };
  return map[type] ?? type;
}

/** Returns the icon glyph for a given notification type */
function typeIcon(type: string): string {
  if (type.startsWith('payment')) return 'payments';
  if (type.startsWith('review')) return 'star';
  if (type.startsWith('message')) return 'chat';
  if (type.startsWith('application')) return 'assignment';
  return 'notifications';
}

interface RowProps {
  item: Notification;
  colors: ThemeColors;
  onPress?: (n: Notification) => void;
}

function NotificationRow({ item, colors, onPress }: RowProps) {
  const unread = !item.read;
  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Icon name={typeIcon(item.type)} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowLabel, { color: colors.onSurface }]}>
            {typeLabel(item.type)}
          </Text>
          {unread && (
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          )}
        </View>
        <Text
          style={[styles.rowMessage, { color: colors.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={[styles.rowTime, { color: colors.outline }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </>
  );
  const style = [
    styles.row,
    {
      backgroundColor: unread ? colors.paidBg : colors.surface,
      borderColor: colors.border,
    },
  ];

  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <TouchableOpacity
      style={style}
      onPress={() => onPress(item)}
      activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

function notificationRoute(notification: Notification): string | null {
  if (!notification.refId) return null;
  switch (notification.refType) {
    case 'conversation': return `/messages/${notification.refId}`;
    case 'assignment': return `/assignments/${notification.refId}`;
    case 'opportunity': return `/opportunities/${notification.refId}`;
    case 'application': return '/applications';
    default: return null;
  }
}

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.list();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Marks each unread notification read sequentially.
   * Errors on individual items are swallowed — a failed mark-read must not block the user.
   */
  const handleMarkAllRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    const unread = items.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await notificationsService.markRead(n._id);
      } catch {
        // fire-and-forget: skip failed individual mark
      }
    }
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
  }, [items, markingAll]);

  /** Marks a single notification read on tap and navigates to the referenced resource */
  const handlePress = useCallback(
    async (n: Notification) => {
      if (!n.read) {
        try {
          await notificationsService.markRead(n._id);
          setItems((prev) =>
            prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
          );
        } catch {
          // non-blocking
        }
      }
      const route = notificationRoute(n);
      if (route) router.push(route as any);
    },
    [router]
  );

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <AppShell>
      <TopAppBar
        title="Notifications"
        showBack
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        showHelp={false}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll}>
              <Text
                style={[
                  styles.markAll,
                  { color: markingAll ? colors.outline : colors.primary },
                ]}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

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

      {!loading && !error && items.length === 0 && (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            You have no notifications yet.
          </Text>
        </View>
      )}

      {!loading && !error && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(n) => n._id}
          renderItem={({ item }) => (
            <NotificationRow item={item} colors={colors} onPress={notificationRoute(item) ? handlePress : undefined} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  list: { padding: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1, gap: 2 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowMessage: { fontSize: 13, lineHeight: 18 },
  rowTime: { fontSize: 11, marginTop: 2 },
  markAll: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
