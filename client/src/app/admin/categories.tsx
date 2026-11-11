import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '@/api/services/admin.service';
import { Category } from '@/api/services/categories.service';
import { AdminBottomTabs, Button, Card, Icon, Input, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setCategories(await adminService.listCategories());
    } catch (err: any) {
      setError(err.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') loadCategories();
    else setLoading(false);
  }, [loadCategories, user?.role]);

  const addCategory = async () => {
    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      setError('Category names need at least two characters.');
      return;
    }
    if (categories.some((category) => category.name.localeCompare(normalizedName, undefined, { sensitivity: 'accent' }) === 0)) {
      setError('That category already exists.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const category = await adminService.createCategory(normalizedName);
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (err: any) {
      setError(err.message || 'Unable to add category.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (category: Category) => {
    try {
      setUpdatingId(category._id);
      setError('');
      const updated = await adminService.updateCategory(category._id, { isActive: !category.isActive });
      setCategories((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err: any) {
      setError(err.message || 'Unable to update category.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <TopAppBar title="Category Management" showBack onBack={() => router.back()} showHelp={false} />
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
      <TopAppBar title="Category Management" showBack onBack={() => router.back()} showHelp={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Add a category</Text>
          <Input label="Category name" value={name} onChangeText={setName} maxLength={60} placeholder="e.g. Tutoring" />
          <Button title="Add category" leftIcon="add" loading={saving} disabled={!name.trim()} onPress={addCategory} />
        </Card>
        {error ? <Text style={[styles.error, { color: colors.alertText }]}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No categories yet.</Text>
          </Card>
        ) : categories.map((category) => (
          <Card key={category._id} style={styles.categoryCard}>
            <View style={styles.categoryText}>
              <Text style={[styles.categoryName, { color: colors.onSurface }]}>{category.name}</Text>
              <Text style={[styles.categoryStatus, { color: category.isActive ? colors.volunteerText : colors.outline }]}>{category.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: category.isActive, disabled: updatingId === category._id }} disabled={updatingId === category._id} onPress={() => toggleCategory(category)} style={[styles.toggle, { backgroundColor: category.isActive ? colors.secondary : colors.surfaceSecondary, opacity: updatingId === category._id ? 0.6 : 1 }]}>
              <View style={[styles.toggleKnob, { alignSelf: category.isActive ? 'flex-end' : 'flex-start', backgroundColor: colors.surface }]} />
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
      <AdminBottomTabs active="categories" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.gutter, paddingBottom: 100, gap: Spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  card: { gap: Spacing.sm },
  title: { fontSize: 16, fontWeight: '700' },
  error: { fontSize: 13, fontWeight: '600' },
  categoryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryText: { gap: 2 },
  categoryName: { fontSize: 15, fontWeight: '700' },
  categoryStatus: { fontSize: 12, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: 13 },
  toggle: { borderRadius: BorderRadius.full, height: 28, justifyContent: 'center', padding: 3, width: 50 },
  toggleKnob: { borderRadius: BorderRadius.full, height: 22, width: 22 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  deniedTitle: { fontSize: 18, fontWeight: '700' },
});
