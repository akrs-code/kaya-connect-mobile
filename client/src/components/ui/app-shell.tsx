import type { PropsWithChildren } from 'react';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { AppBottomTabs, type AppTab } from './app-bottom-tabs';
import { AppHeader, type TopAppBarProps } from './top-app-bar';

type AppShellProps = PropsWithChildren<{
  header?: TopAppBarProps;
  activeTab?: AppTab | null;
  applicationCount?: number;
}>;

/**
 * Standard mobile frame for user-facing screens. It owns top/side safe areas,
 * the shared header, and the bottom navigation's home-indicator inset.
 */
export function AppShell({ children, header, activeTab, applicationCount }: AppShellProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: Colors.light.canvas }]}>
      {header ? <AppHeader {...header} /> : null}
      <View style={styles.content}>{children}</View>
      {activeTab !== undefined ? <AppBottomTabs active={activeTab} applicationCount={applicationCount} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1 },
});
