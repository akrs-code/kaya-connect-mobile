/**
 * @file messages/index.tsx
 * @description Screen 5.2 — Active Conversations List.
 *
 * Why: Displays all conversations the authenticated user participates in
 * (GET /conversations), sorted newest-message-first by the backend.
 * Each row shows the other participant's name and conversation timestamps.
 * Tapping a row navigates to the message thread screen (5.3).
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
import { useAuth } from '@/context/auth-context';
import { conversationsService } from '@/api/services/conversations.service';
import { Conversation } from '@/api/types';
import { AppShell } from '@/components/ui';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Returns the other participant (not the current user) from a conversation */
function otherParticipant(conv: Conversation, myId: string) {
  return conv.participants.find((p) => p._id !== myId) ?? conv.participants[0];
}

/** Formats lastMessageAt or updatedAt into a short date/time label */
function timeLabel(conv: Conversation): string {
  const raw = conv.lastMessageAt ?? conv.updatedAt;
  if (!raw) return '';
  const date = new Date(raw);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString();
}

interface RowProps {
  conv: Conversation;
  myId: string;
  colors: ThemeColors;
  onPress: (conv: Conversation) => void;
}

function ConversationRow({ conv, myId, colors, onPress }: RowProps) {
  const other = otherParticipant(conv, myId);
  const initials = other?.fullName
    ? other.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={() => onPress(conv)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
        <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initials}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {other?.fullName ?? 'Unknown'}
          </Text>
          <Text style={[styles.time, { color: colors.outline }]}>{timeLabel(conv)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await conversationsService.list();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = useCallback(
    (conv: Conversation) => {
      router.push(`/messages/${conv._id}` as any);
    },
    [router]
  );

  return (
    <AppShell header={{ title: 'Messages', showBack: false, showHelp: false }} activeTab={null}>

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
            No conversations yet. Apply to an opportunity to start chatting.
          </Text>
        </View>
      )}

      {!loading && !error && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(c) => c._id}
          renderItem={({ item }) => (
            <ConversationRow
              conv={item}
              myId={user?.id ?? ''}
              colors={colors}
              onPress={handlePress}
            />
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
  list: { padding: Spacing.lg, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: Spacing.sm },
  time: { fontSize: 11 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
