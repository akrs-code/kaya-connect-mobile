/**
 * @file top-app-bar.tsx
 * @description Standardized navigation header bar displaying back button, brand title, and action buttons.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { notificationsService } from '@/api/services/notifications.service';
import { Notification } from '@/api/types';
import { Icon } from './icon';

export interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** @deprecated Help is no longer shown in app headers. */
  showHelp?: boolean;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title = 'KayaConnect',
  showBack = true,
  onBack,
  showNotifications = true,
  rightAction,
}: TopAppBarProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [notificationMenuVisible, setNotificationMenuVisible] = React.useState(false);
  const [recentNotifications, setRecentNotifications] = React.useState<Notification[]>([]);
  const notificationTriggerRef = React.useRef<any>(null);

  const closeNotificationMenu = React.useCallback(() => {
    setNotificationMenuVisible(false);
    if (Platform.OS === 'web') notificationTriggerRef.current?.focus?.();
  }, []);

  React.useEffect(() => {
    if (!notificationMenuVisible) return;
    notificationsService.list().then((items) => setRecentNotifications(items.slice(0, 3))).catch(() => setRecentNotifications([]));
  }, [notificationMenuVisible]);

  React.useEffect(() => {
    if (!notificationMenuVisible || Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNotificationMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeNotificationMenu, notificationMenuVisible]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={[styles.iconButton, { backgroundColor: 'transparent' }]}>
            <Icon name="arrow_back" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>

        <View style={styles.rightActions}>
          {rightAction}
          {isAuthenticated && showNotifications ? (
            <TouchableOpacity
              ref={notificationTriggerRef}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => setNotificationMenuVisible(true)}
              style={styles.iconButton}>
              <Icon name="notifications" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <Modal transparent visible={notificationMenuVisible} animationType="fade" onRequestClose={closeNotificationMenu}>
        <Pressable style={styles.notificationOverlay} onPress={closeNotificationMenu}>
          <Pressable accessibilityRole="dialog" accessibilityViewIsModal style={[styles.notificationMenu, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, { color: colors.onSurface }]}>Notifications</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close notifications" onPress={closeNotificationMenu} style={styles.notificationClose}>
                <Icon name="close" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {recentNotifications.length ? recentNotifications.map((notification) => (
              <Text key={notification._id} numberOfLines={2} style={[styles.notificationDescription, { color: notification.read ? colors.onSurfaceVariant : colors.onSurface }]}>{notification.message}</Text>
            )) : <Text style={[styles.notificationDescription, { color: colors.onSurfaceVariant }]}>You have no recent notifications.</Text>}
            <TouchableOpacity onPress={() => { closeNotificationMenu(); router.push('/notifications'); }} style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    height: 56,
    zIndex: 40,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 56,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  iconButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginHorizontal: Spacing.sm,
    textAlign: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 36,
    justifyContent: 'flex-end',
  },
  spacer: {
    width: 44,
  },
  notificationOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.16)', alignItems: 'flex-end', paddingTop: 76, paddingHorizontal: Spacing.gutter },
  notificationMenu: { borderRadius: BorderRadius.lg, borderWidth: 1, elevation: 3, gap: Spacing.sm, maxWidth: 320, padding: Spacing.md, shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 10, width: '100%' },
  notificationHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  notificationTitle: { fontSize: 15, fontWeight: '700' },
  notificationClose: { alignItems: 'center', height: 44, justifyContent: 'center', marginRight: -Spacing.xs, width: 44 },
  notificationDescription: { fontSize: 13, lineHeight: 18 },
  viewAllButton: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 28 },
  viewAllText: { fontSize: 13, fontWeight: '700' },
});

/** @deprecated Use AppHeader for new screens. */
export const TopAppBar = AppHeader;

