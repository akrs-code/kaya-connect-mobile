import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assignmentsService } from '@/api/services/assignments.service';
import { Assignment } from '@/api/types';
import { Button, Card, Icon, TopAppBar } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const statusLabel: Record<string, string> = {
  awaiting_agreement: 'Agreement pending',
  agreed: 'Ready to start',
  in_progress: 'In progress',
  completion_pending: 'Completion review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type AssignmentView = 'active' | 'history';

const isActiveAssignment = (status: Assignment['status']) => !['completed', 'cancelled'].includes(status);

export default function AssignmentsScreen() {
  const router = useRouter();
  const { isAuthenticated, profile, user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<AssignmentView>('active');

  const load = useCallback(async () => {
    try {
      setError('');
      setAssignments(await assignmentsService.listMine());
    } catch (err: any) {
      setError(err.message || 'Unable to load your tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    load();
  }, [isAuthenticated, load, router]);

  const activeAssignments = assignments.filter((assignment) => isActiveAssignment(assignment.status));
  const historyAssignments = assignments.filter((assignment) => !isActiveAssignment(assignment.status));
  const visibleAssignments = view === 'active' ? activeAssignments : historyAssignments;
  const screenTitle = profile?.intent === 'requester'
    ? 'Task Requests'
    : profile?.intent === 'both'
      ? 'Work & Requests'
      : 'My Work';
  const emptyAction = profile?.intent === 'requester'
    ? { title: 'Post a task', route: '/opportunities/create' }
    : { title: 'Browse opportunities', route: '/' };

  const assignmentRole = (assignment: Assignment) => {
    const requesterId = typeof assignment.requester === 'object' ? assignment.requester.id : assignment.requester;
    return requesterId === user?.id ? 'Requesting help' : 'Providing help';
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar title={screenTitle} showBack onBack={() => router.back()} showHelp={false} />
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /></View> : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          {error ? (
            <View style={styles.state}>
              <Icon name="error" size={40} color={colors.error} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>Couldn’t load tasks</Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>{error}</Text>
              <Button title="Try again" variant="outline" onPress={() => { setLoading(true); load(); }} />
            </View>
          ) : null}
          {!error && assignments.length > 0 ? (
            <View style={[styles.tabs, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {(['active', 'history'] as const).map((nextView) => {
                const selected = view === nextView;
                const count = nextView === 'active' ? activeAssignments.length : historyAssignments.length;
                return (
                  <TouchableOpacity
                    key={nextView}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setView(nextView)}
                    style={[styles.tab, { backgroundColor: selected ? colors.surface : 'transparent' }]}>
                    <Text style={[styles.tabText, { color: selected ? colors.primary : colors.onSurfaceVariant }]}>
                      {nextView === 'active' ? `Active (${count})` : `History (${count})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {!error && visibleAssignments.length === 0 ? (
            <View style={styles.state}>
              <Icon name="assignment" size={40} color={colors.outline} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>{view === 'active' ? 'No active tasks' : 'No task history'}</Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {view === 'active' ? 'Tasks appear here when an application is selected.' : 'Completed and cancelled tasks appear here.'}
              </Text>
              {view === 'active' ? <Button title={emptyAction.title} variant="outline" onPress={() => router.replace(emptyAction.route as any)} /> : null}
            </View>
          ) : null}
          {!error && visibleAssignments.map((assignment) => {
            const opportunity = typeof assignment.opportunity === 'object' ? assignment.opportunity : null;
            return (
              <Card key={assignment._id} style={styles.card}>
                <Icon name="assignment" size={22} color={colors.primary} />
                <Text style={[styles.title, { color: colors.onSurface }]}>{opportunity?.title || 'Campus task'}</Text>
                <Text style={[styles.status, { color: colors.secondary }]}>{statusLabel[assignment.status] || assignment.status}</Text>
                <Text style={[styles.role, { color: colors.onSurfaceVariant }]}>{assignmentRole(assignment)}</Text>
                <Button title="Open task" rightIcon="arrow_forward" onPress={() => router.push(`/assignments/${assignment._id}` as any)} />
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  state: { alignItems: 'center', flex: 1, gap: Spacing.md, justifyContent: 'center', padding: Spacing.xl },
  card: { gap: Spacing.sm },
  tabs: { borderRadius: 10, borderWidth: 1, flexDirection: 'row', padding: 3 },
  tab: { alignItems: 'center', borderRadius: 8, flex: 1, minHeight: 40, justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 13, fontWeight: '600' },
  role: { fontSize: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { fontSize: 13, fontWeight: '600' },
});
