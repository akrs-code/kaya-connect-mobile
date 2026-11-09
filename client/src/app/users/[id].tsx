import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicProfile } from '@/api/types';
import { usersService } from '@/api/services/users.service';
import { Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    if (!id) return;
    try {
      setError('');
      setProfile(await usersService.getPublicProfile(id));
    } catch (err: any) {
      setError(err?.message || 'This member profile is unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadProfile();
  }, [id, isAuthenticated]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <TopAppBar title="Member Profile" showBack onBack={() => router.back()} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}>
          {error || !profile ? (
            <View style={styles.center}>
              <Icon name="person" size={40} color={colors.outline} />
              <Text style={[styles.error, { color: colors.alertText }]}>{error || 'Profile not found.'}</Text>
              <Button title="Go back" variant="outline" onPress={() => router.back()} />
            </View>
          ) : (
            <>
              <Card style={styles.heroCard}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{profile.fullName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.name, { color: colors.onSurface }]}>{profile.fullName}</Text>
                <Text style={[styles.memberSince, { color: colors.onSurfaceVariant }]}>
                  {profile.memberSince ? `Member since ${new Date(profile.memberSince).getFullYear()}` : 'MSU community member'}
                </Text>
                <View style={[styles.rating, { backgroundColor: colors.warningBg }]}>
                  <Icon name="star" size={16} color={colors.warningText} filled />
                  <Text style={[styles.ratingText, { color: colors.warningText }]}>
                    {profile.reviewSummary?.totalReviews
                      ? `${profile.reviewSummary.averageRating?.toFixed(1)} (${profile.reviewSummary.totalReviews} reviews)`
                      : 'No reviews yet'}
                  </Text>
                </View>
              </Card>

              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>About</Text>
                <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{profile.biography || 'This member has not added an introduction yet.'}</Text>
              </Card>

              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Skills</Text>
                <View style={styles.chips}>
                  {profile.skills.length ? profile.skills.map((skill) => (
                    <View key={skill} style={[styles.chip, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.chipText, { color: colors.onSurface }]}>{skill}</Text>
                    </View>
                  )) : <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>No skills listed yet.</Text>}
                </View>
              </Card>

              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Service areas</Text>
                <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{profile.serviceArea.length ? profile.serviceArea.join(' • ') : 'MSU Main Campus'}</Text>
              </Card>

              <Button
                title="Report this member"
                variant="outline"
                leftIcon="flag"
                onPress={() => router.push({
                  pathname: '/reports/create' as any,
                  params: { targetType: 'user', targetId: profile.id, targetTitle: profile.fullName },
                })}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  center: { alignItems: 'center', flex: 1, gap: Spacing.md, justifyContent: 'center', padding: Spacing.xl },
  heroCard: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xl },
  avatar: { alignItems: 'center', borderRadius: BorderRadius.full, height: 64, justifyContent: 'center', width: 64 },
  avatarText: { fontSize: 26, fontWeight: '700' },
  name: { fontSize: 21, fontWeight: '700' },
  memberSince: { fontSize: 13 },
  rating: { alignItems: 'center', borderRadius: BorderRadius.full, flexDirection: 'row', gap: 4, marginTop: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '600' },
  error: { fontSize: 14, textAlign: 'center' },
});
