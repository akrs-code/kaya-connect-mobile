import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roleNavigationConfig } from '@/constants/role-navigation';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export type AdminTab = 'dashboard' | 'reports' | 'audit' | 'categories';

export function AdminBottomTabs({ active }: { active: AdminTab }) {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const tabs = roleNavigationConfig.admin as ReadonlyArray<{ id: AdminTab; label: string; icon: string; route: string }>;

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <View style={styles.content}>
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const color = selected ? colors.primaryContainer : colors.onSurfaceVariant;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => router.replace(tab.route as any)}
              style={styles.tab}>
              <Icon name={tab.icon} size={22} color={color} />
              <Text style={[styles.label, { color, fontWeight: selected ? '700' : '500' }]}>{tab.label}</Text>
              <View style={[styles.indicator, { backgroundColor: selected ? colors.primaryContainer : 'transparent' }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingTop: Spacing.xs, paddingBottom: Spacing.sm },
  content: { alignSelf: 'center', flexDirection: 'row', maxWidth: 480, width: '100%' },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 52 },
  label: { fontSize: 11, marginTop: 2 },
  indicator: { borderRadius: BorderRadius.full, bottom: -2, height: 3, position: 'absolute', width: 20 },
});
