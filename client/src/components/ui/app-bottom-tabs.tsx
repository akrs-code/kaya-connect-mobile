import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { getRoleTab } from '@/constants/role-navigation';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export type AppTab = 'browse' | 'applications' | 'listings' | 'tasks' | 'messages' | 'profile';

interface AppBottomTabsProps {
  active: AppTab | null;
  applicationCount?: number;
}

export function AppBottomTabs({ active, applicationCount = 0 }: AppBottomTabsProps) {
  const router = useRouter();
  const { isAuthenticated, profile } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const intent = profile?.intent ?? 'both';

  const navigate = (route: string, requiresAuth = false) => {
    router.replace((requiresAuth && !isAuthenticated ? '/auth/login' : route) as any);
  };

  const tab = (id: Exclude<AppTab, 'profile'> | 'profile', count?: number) => {
    const item = getRoleTab('user', id);
    if (!item) return null;
    const selected = active === id;
    const color = selected ? colors.primaryContainer : colors.onSurfaceVariant;
    const badgeCount = count ?? 0;
    return (
      <TouchableOpacity
        key={id}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={item.label}
        style={styles.tab}
        onPress={() => navigate(item.route, item.requiresAuth)}>
        <View style={styles.iconWrap}>
          <Icon name={item.icon} size={22} color={color} />
          {badgeCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, { color, fontWeight: selected ? '700' : '500' }]}>{item.label}</Text>
        <View style={[styles.indicator, { backgroundColor: selected ? colors.primaryContainer : 'transparent' }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, height: 60 + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.content}>
        {tab('browse')}
        {intent === 'requester' ? tab('listings') : tab('applications', applicationCount)}
        {intent === 'provider' ? tab('tasks') : (
          <View style={styles.postTab}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Post a task" onPress={() => navigate(getRoleTab('user', 'post')?.route ?? '/', true)} style={[styles.postButton, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="add" size={24} color={colors.onPrimary} />
            </TouchableOpacity>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Post</Text>
          </View>
        )}
        {intent === 'both' ? tab('listings') : tab('messages')}
        {tab('profile')}
      </View>
      {intent === 'both' && active !== null && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open chats"
          onPress={() => navigate('/messages', true)}
          style={[styles.chatButton, { backgroundColor: colors.primaryContainer }]}>
          <Icon name="chat" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingTop: 4,
  },
  content: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 480,
    paddingHorizontal: Spacing.md,
    width: '100%',
    height: 56,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 25,
    minWidth: 25,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  indicator: {
    borderRadius: BorderRadius.full,
    bottom: -2,
    height: 3,
    position: 'absolute',
    width: 20,
  },
  badge: {
    borderRadius: BorderRadius.full,
    minWidth: 16,
    paddingHorizontal: 3,
    paddingVertical: 1,
    position: 'absolute',
    right: -8,
    top: -5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  postTab: {
    alignItems: 'center',
    flex: 1,
    height: 56,
  },
  postButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    height: 44,
    justifyContent: 'center',
    marginTop: -18,
    width: 44,
  },
  chatButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    bottom: 88,
    elevation: 8,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 52,
  },
});
