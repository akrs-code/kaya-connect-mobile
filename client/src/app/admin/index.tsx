import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminBottomTabs, Button, Card, Icon, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (!user) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Admin Console" showBack onBack={() => router.back()} showHelp={false} />
        <View style={styles.state}>
          <Icon name="lock" size={38} color={colors.outline} />
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>Sign in required</Text>
          <Button title="Sign in" onPress={() => router.replace('/auth/login')} />
        </View>
      </SafeAreaView>
    );
  }

  if (user.role !== 'admin') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Admin Console" showBack onBack={() => router.back()} showHelp={false} />
        <View style={styles.state}>
          <Icon name="shield" size={38} color={colors.alertText} />
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>Administrator access only</Text>
          <Text style={[styles.stateText, { color: colors.outline }]}>Your signed-in account does not have campus administrator permissions.</Text>
          <Button title="Return home" variant="outline" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar title="Admin tools" showBack onBack={() => router.back()} showHelp={false} />
      <View style={styles.content}>
        <View style={styles.heading}>
          <Icon name="shield" size={30} color={colors.primary} />
          <View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Admin tools</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Icon name="error" size={24} color={colors.alertText} />
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Reports & moderation</Text>
          <Text style={[styles.cardText, { color: colors.onSurfaceVariant }]}>Review reported content and accounts.</Text>
          <Button title="Moderation" rightIcon="arrow_forward" onPress={() => router.push('/admin/moderation')} />
        </Card>

        <Card style={styles.card}>
          <Icon name="category" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Opportunity categories</Text>
          <Text style={[styles.cardText, { color: colors.onSurfaceVariant }]}>Manage listing categories.</Text>
          <Button title="Categories" rightIcon="arrow_forward" onPress={() => router.push('/admin/categories')} />
        </Card>

        <Card style={styles.card}>
          <Icon name="history" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Audit activity</Text>
          <Text style={[styles.cardText, { color: colors.onSurfaceVariant }]}>Review recorded actions.</Text>
          <Button title="Audit activity" rightIcon="arrow_forward" onPress={() => router.push('/admin/audit')} />
        </Card>
      </View>
      <AdminBottomTabs active="dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  heading: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  card: { gap: Spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardText: { fontSize: 13, lineHeight: 18 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  stateTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stateText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
