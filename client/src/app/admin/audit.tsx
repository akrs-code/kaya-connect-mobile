import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '@/api/services/admin.service';
import { AuditEvent } from '@/api/types';
import { AdminBottomTabs, Button, Card, Chip, Icon, Input, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const EVENT_FILTERS = [
  { label: 'All activity', value: undefined },
  { label: 'Report resolutions', value: 'report.resolved' },
  { label: 'Suspensions', value: 'user.suspended' },
  { label: 'Removed listings', value: 'opportunity.removed' },
  { label: 'Category updates', value: 'category.updated' },
] as const;

const DATE_FILTERS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: 'All time', value: undefined },
] as const;

const labelForEvent = (eventType: string) => eventType.replaceAll('.', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const eventColor = (eventType: string, colors: ThemeColors) => {
  if (eventType.includes('suspended') || eventType.includes('removed') || eventType.includes('hidden')) return { backgroundColor: colors.alertBg, color: colors.alertText };
  if (eventType.includes('category')) return { backgroundColor: colors.warningBg, color: colors.warningText };
  if (eventType.includes('reactivated') || eventType.includes('reinstate')) return { backgroundColor: colors.volunteerBg, color: colors.volunteerText };
  return { backgroundColor: colors.paidBg, color: colors.paidText };
};

function AuditCard({ event, colors }: { event: AuditEvent; colors: ThemeColors }) {
  const actor = typeof event.actor === 'string' ? 'System' : event.actor.fullName;
  const timestamp = new Date(event.createdAt).toLocaleString();
  const eventStyle = eventColor(event.eventType, colors);
  const metadata = event.metadata ?? {};
  const details = [
    typeof metadata.reason === 'string' ? metadata.reason : undefined,
    typeof metadata.from === 'string' ? `Previous status: ${metadata.from.replaceAll('_', ' ')}` : undefined,
    typeof metadata.version === 'number' ? `Version ${metadata.version}` : undefined,
  ].filter(Boolean);

  return (
    <Card style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventHeaderText}>
          <Text style={[styles.eventTitle, { color: colors.onSurface }]}>{labelForEvent(event.eventType)}</Text>
          <Text style={[styles.timestamp, { color: colors.outline }]}>{timestamp}</Text>
        </View>
        <View style={[styles.eventPill, { backgroundColor: eventStyle.backgroundColor }]}>
          <Text style={[styles.eventPillText, { color: eventStyle.color }]}>{event.targetType}</Text>
        </View>
      </View>
      <View style={[styles.actorRow, { borderTopColor: colors.border }]}>
        <Icon name="person" size={15} color={colors.outline} />
        <Text style={[styles.actorText, { color: colors.onSurfaceVariant }]}>Performed by {actor}</Text>
      </View>
      {details.map((detail) => (
        <Text key={detail} style={[styles.detailText, { color: colors.onSurfaceVariant }]}>{detail}</Text>
      ))}
    </Card>
  );
}

export default function AdminAuditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [eventType, setEventType] = useState<string | undefined>();
  const [days, setDays] = useState<number | undefined>(30);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const hasMore = events.length < total;
  const query = useMemo(() => ({ eventType, search: appliedSearch || undefined, days, limit: 20 }), [appliedSearch, days, eventType]);

  const loadEvents = useCallback(async (requestedPage = 1, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');
      const result = await adminService.listAuditEvents({ ...query, page: requestedPage });
      setEvents((current) => append ? [...current, ...result.items] : result.items);
      setTotal(result.total);
      setPage(requestedPage);
    } catch (err: any) {
      setError(err?.message || 'Unable to load audit activity.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query]);

  useEffect(() => {
    if (user?.role === 'admin') loadEvents();
    else setLoading(false);
  }, [loadEvents, user?.role]);

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Audit Activity" showBack onBack={() => router.back()} showNotifications={false} />
        <View style={styles.denied}>
          <Icon name="shield" size={38} color={colors.alertText} />
          <Text style={[styles.deniedTitle, { color: colors.onSurface }]}>Administrator access only</Text>
          <Button title={user ? 'Return home' : 'Sign in'} onPress={() => router.replace(user ? '/' : '/auth/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar title="Audit Activity" showBack onBack={() => router.back()} showNotifications={false} />
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AuditCard event={item} colors={colors} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading && events.length > 0} onRefresh={() => loadEvents()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.heading, { color: colors.onSurface }]}>Recorded activity</Text>
            <Text style={[styles.subheading, { color: colors.onSurfaceVariant }]}>Review recorded actions.</Text>
            <Input
              placeholder="Search actions or target type"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => setAppliedSearch(search.trim())}
              returnKeyType="search"
              leftIcon="search"
            />
            <View style={styles.filters}>
              {EVENT_FILTERS.map((filter) => <Chip key={filter.label} label={filter.label} selected={eventType === filter.value} onPress={() => setEventType(filter.value)} />)}
            </View>
            <View style={styles.dateFilters}>
              {DATE_FILTERS.map((filter) => (
                <TouchableOpacity key={filter.label} onPress={() => setDays(filter.value)} style={[styles.dateButton, { borderColor: days === filter.value ? colors.primary : colors.border, backgroundColor: days === filter.value ? colors.paidBg : colors.surface }]}>
                  <Text style={[styles.dateButtonText, { color: days === filter.value ? colors.paidText : colors.onSurfaceVariant }]}>{filter.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error ? <Text style={[styles.error, { color: colors.alertText }]}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <View style={styles.empty}><Icon name="history" size={34} color={colors.outline} /><Text style={[styles.emptyText, { color: colors.outline }]}>No audit activity matches these filters.</Text></View>}
        ListFooterComponent={hasMore ? <Button title="Load more" variant="outline" loading={loadingMore} onPress={() => loadEvents(page + 1, true)} style={styles.loadMore} /> : undefined}
      />
      <AdminBottomTabs active="audit" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { gap: Spacing.sm, maxWidth: 480, padding: Spacing.gutter, paddingBottom: 100, width: '100%', alignSelf: 'center' },
  header: { gap: Spacing.sm, marginBottom: Spacing.xs },
  heading: { fontSize: 20, fontWeight: '700' },
  subheading: { fontSize: 13, lineHeight: 18 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  dateFilters: { flexDirection: 'row', gap: Spacing.xs },
  dateButton: { borderRadius: BorderRadius.md, borderWidth: 1, flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs },
  dateButtonText: { fontSize: 11, fontWeight: '700' },
  eventCard: { gap: Spacing.sm },
  eventHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' },
  eventHeaderText: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '700' },
  timestamp: { fontSize: 11 },
  eventPill: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  eventPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  actorRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', gap: Spacing.xs, paddingTop: Spacing.sm },
  actorText: { fontSize: 12 },
  detailText: { fontSize: 12, lineHeight: 17 },
  loader: { marginTop: Spacing.xl },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { fontSize: 13, textAlign: 'center' },
  error: { fontSize: 13, fontWeight: '600' },
  loadMore: { marginVertical: Spacing.sm },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  deniedTitle: { fontSize: 18, fontWeight: '700' },
});
