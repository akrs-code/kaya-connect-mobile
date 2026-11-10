/**
 * @file messages/[id].tsx
 * @description Screen 5.3 — Private Chat & Message Thread.
 *
 * Why: Renders a paginated message thread for a conversation (GET /conversations/:id/messages)
 * and allows the user to send text messages (POST /conversations/:id/messages).
 * Cursor-based pagination via `before` message _id is used for infinite scroll upward.
 * Image upload is not implemented — the backend accepts multipart but React Native
 * platform-specific FormData handling is deferred.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conversationsService } from '@/api/services/conversations.service';
import { Message } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { TopAppBar } from '@/components/ui/top-app-bar';
import { BorderRadius, Colors, Spacing, ThemeColors } from '@/constants/theme';

/** Renders a single message bubble, aligned by sender */
function MessageBubble({
  msg,
  isMe,
  colors,
}: {
  msg: Message;
  isMe: boolean;
  colors: ThemeColors;
}) {
  return (
    <View
      style={[
        styles.bubbleWrap,
        isMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMe ? colors.primaryContainer : colors.surfaceSecondary,
          },
        ]}
      >
        {msg.text ? (
          <Text style={[styles.bubbleText, { color: isMe ? colors.onPrimary : colors.onSurface }]}>
            {msg.text}
          </Text>
        ) : null}
        {msg.media?.map((m, i) => (
          <Text
            key={i}
            style={[styles.bubbleText, { color: isMe ? colors.onPrimary : colors.onSurfaceVariant }]}
          >
            [Image]
          </Text>
        ))}
        <Text style={[styles.bubbleTime, { color: isMe ? '#cce0ff' : colors.outline }]}>
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  /** Oldest message _id known — used as cursor for loading older messages */
  const oldestId = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(
    async (before?: string) => {
      if (!id) return;
      try {
        if (before) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        const data = await conversationsService.getMessages(id, before);
        setMessages((prev) => (before ? [...prev, ...data] : data));
        if (data.length > 0) {
          oldestId.current = data[data.length - 1]._id;
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load messages');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Sends a text message via POST /conversations/:id/messages.
   * Appends the returned message to the top of the displayed list (newest first).
   */
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !id) return;
    try {
      setSending(true);
      const sent = await conversationsService.sendText(id, trimmed);
      setText('');
      setMessages((prev) => [sent, ...prev]);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e: any) {
      // Surface error inline without crashing; user can retry
      setError(e?.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [id, text, sending]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <TopAppBar
        title="Chat"
        showBack
        onBack={() => router.back()}
        showHelp={false}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isMe={item.sender === user?.id}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (!loadingMore && oldestId.current) {
              load(oldestId.current);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.loadMore} /> : undefined
          }
        />
      )}

      {/* Compose bar */}
      <View
        style={[
          styles.compose,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceSecondary,
              color: colors.onSurface,
              borderColor: colors.border,
            },
          ]}
          placeholder="Type a message…"
          placeholderTextColor={colors.outline}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: text.trim() ? colors.primary : colors.surfaceSecondary },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.sendIcon, { color: text.trim() ? colors.onPrimary : colors.outline }]}>
              ↑
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  loadMore: { marginVertical: Spacing.sm },
  bubbleWrap: { marginBottom: Spacing.sm, maxWidth: '80%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  compose: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, fontWeight: '700' },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  retryText: { fontSize: 14, fontWeight: '600' },
});
