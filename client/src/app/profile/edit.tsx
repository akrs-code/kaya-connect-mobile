/**
 * @file edit.tsx
 * @description Screen 2.2: Profile & Portfolio Edit.
 * Enables updating biography, campus service area, skills matrix, weekly schedule availability,
 * and managing portfolio work sample items with direct backend synchronization.
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvailabilitySlot, DayOfWeek, UpdateProfileDto } from '@/api/types';
import { usersService } from '@/api/services/users.service';
import { Button, Card, Chip, Icon, Input, Textarea, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  createPortfolioFormData,
  MAX_PORTFOLIO_ITEMS,
  pickPortfolioImage,
  PortfolioImageSource,
  SelectedPortfolioImage,
} from '@/utils/portfolio-image';

const SERVICE_AREAS = [
  'MSU Main Campus - Dorms/Halls',
  'MSU Commercial Center',
  'Marawi City Central',
  'Outskirts / Neighboring Barangay',
];

const DAYS: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'Sa' },
  { key: 'sun', label: 'Su' },
];

const titleFromFileName = (fileName: string) => fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

/**
 * ProfileEditScreen Component
 * 
 * Provides an interactive interface for authenticated users to update their bio,
 * campus service areas, expertise tags, weekly availability schedule, and portfolio items.
 * Synchronizes directly with NestJS users API endpoints (`PUT /users/me/profile`,
 * `DELETE /users/me/portfolio/:id`).
 */
export default function ProfileEditScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isNarrow = width <= 380;
  const { user, profile, refreshProfile } = useAuth();

  // Form State initialized from current user profile
  const [serviceArea, setServiceArea] = useState(
    profile?.serviceArea?.[0] || 'MSU Main Campus - Dorms/Halls'
  );
  const [bio, setBio] = useState(profile?.biography || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Extract initial active days from availability
  const initialDays = Array.from(
    new Set(profile?.availability?.map((a) => a.day) || ['mon', 'wed', 'fri'])
  ) as DayOfWeek[];
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(initialDays);

  const [hasMorning, setHasMorning] = useState(true);
  const [hasAfternoon, setHasAfternoon] = useState(true);
  const [hasEvening, setHasEvening] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [portfolio, setPortfolio] = useState(profile?.portfolio || []);
  const [selectedImage, setSelectedImage] = useState<SelectedPortfolioImage | null>(null);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin/moderation');
  }, [router, user?.role]);

  const choosePortfolioImage = async (source: PortfolioImageSource) => {
    if (portfolio.length >= MAX_PORTFOLIO_ITEMS) {
      setErrorMessage(`You can add up to ${MAX_PORTFOLIO_ITEMS} portfolio samples.`);
      return;
    }
    try {
      setErrorMessage('');
      const image = await pickPortfolioImage(source);
      if (!image) return;
      setSelectedImage(image);
      setPortfolioTitle(titleFromFileName(image.fileName));
      setPortfolioDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to select this image.');
    }
  };

  const uploadAvatar = async (source: PortfolioImageSource) => {
    try {
      setErrorMessage('');
      const image = await pickPortfolioImage(source);
      if (!image) return;
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', { uri: image.uri, name: image.fileName, type: image.mimeType } as any);
      await usersService.uploadAvatar(formData);
      await refreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to upload your profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadPortfolioImage = async () => {
    if (!selectedImage || !portfolioTitle.trim()) {
      setErrorMessage('Add a title before uploading this portfolio sample.');
      return;
    }
    setUploadingPortfolio(true);
    setErrorMessage('');
    try {
      const item = await usersService.addPortfolio(
        createPortfolioFormData(selectedImage, portfolioTitle, portfolioDescription),
      );
      setPortfolio((current) => [...current, item]);
      setSelectedImage(null);
      setPortfolioTitle('');
      setPortfolioDescription('');
      await refreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload portfolio sample. Please try again.');
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDeletePortfolio = (id?: string) => {
    if (!id) return;
    Alert.alert('Remove portfolio sample?', 'This photo will be permanently removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await usersService.removePortfolio(id);
            setPortfolio((current) => current.filter((item) => item._id !== id));
            await refreshProfile();
          } catch (err: any) {
            setErrorMessage(err.message || 'Failed to remove portfolio sample');
          }
        },
      },
    ]);
  };

  const handleSaveChanges = async () => {
    setErrorMessage('');
    setSaving(true);
    try {
      // Build availability slots
      const availabilitySlots: AvailabilitySlot[] = [];
      const windowTimes: Record<string, { from: string; to: string }> = {
        morning: { from: '08:00', to: '12:00' },
        afternoon: { from: '12:00', to: '17:00' },
        evening: { from: '17:00', to: '21:00' },
      };

      const selectedWindows = [
        ...(hasMorning ? ['morning'] : []),
        ...(hasAfternoon ? ['afternoon'] : []),
        ...(hasEvening ? ['evening'] : []),
      ];

      for (const day of activeDays) {
        for (const win of selectedWindows) {
          if (availabilitySlots.length < 14) {
            availabilitySlots.push({
              day,
              from: windowTimes[win].from,
              to: windowTimes[win].to,
            });
          }
        }
      }

      const payload: UpdateProfileDto = {
        biography: bio.trim(),
        skills: skills.map((s) => s.trim().toLowerCase()),
        serviceArea: [serviceArea.trim().toLowerCase()],
        availability: availabilitySlots,
        visibility: {
          experience: true,
          availability: true,
          portfolio: true,
        },
      };

      await usersService.upsertProfile(payload);
      await refreshProfile();
      router.back();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === 'admin') return null;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="Edit Profile"
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Avatar Identity Card */}
          <Card style={styles.avatarCard}>
            <View style={styles.avatarCenterCol}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primaryContainer }]}>
                {user?.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : (
                  <Text style={styles.avatarLetter}>{(user?.fullName || 'U').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={[styles.avatarName, { color: colors.onSurface }]}>
                {user?.fullName}
              </Text>
              <Text style={[styles.avatarRole, { color: colors.secondary }]}>
                {user?.email || 'Verified Account'}
              </Text>
              <View style={styles.avatarActions}>
                <Button title="Choose photo" size="sm" variant="outline" loading={uploadingAvatar} onPress={() => uploadAvatar('library')} />
                <Button title="Take photo" size="sm" variant="outline" disabled={uploadingAvatar} onPress={() => uploadAvatar('camera')} />
              </View>
            </View>
          </Card>

          {/* Basic Details Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Icon name="badge" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Basic Details</Text>
            </View>

            {/* Read-only Full Name */}
            <Input
              label="Full Name"
              subLabel="Verified MSU ID"
              subLabelColor={colors.secondary}
              value={user?.fullName || ''}
              editable={false}
              leftIcon="lock"
            />

            {/* Service Area Picker */}
            <View style={styles.areaPickerBlock}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Campus Service Area
              </Text>
              <View style={styles.areaOptionsWrap}>
                {SERVICE_AREAS.map((area) => {
                  const isSelected = serviceArea === area;
                  return (
                    <TouchableOpacity
                      key={area}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.8}
                      onPress={() => setServiceArea(area)}
                      style={[
                        styles.areaOption,
                        {
                          backgroundColor: isSelected ? colors.surfaceSecondary : colors.surface,
                          borderColor: isSelected ? colors.primaryContainer : colors.border,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.areaOptionText,
                          {
                            color: colors.onSurface,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bio Textarea */}
            <Textarea
              label="Bio & Skills Statement"
              placeholder="Brief overview of how you assist peers and local campus community..."
              maxLength={250}
              rows={3}
              value={bio}
              onChangeText={setBio}
            />
          </Card>

          {/* Interactive Skills Tag Editor */}
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Icon name="auto_awesome" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Skills & Expertise</Text>
            </View>

            {/* Input & Add Button */}
            <View style={styles.skillInputRow}>
              <View style={styles.skillInputCol}>
                <Input
                  placeholder="e.g., Python, Electronics Repair"
                  leftIcon="sell"
                  value={newSkillInput}
                  onChangeText={setNewSkillInput}
                  onSubmitEditing={handleAddSkill}
                />
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Add skill"
                activeOpacity={0.8}
                onPress={handleAddSkill}
                style={[styles.addSkillBtn, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="add" size={16} color={colors.onPrimary} />
                <Text style={[styles.addSkillText, { color: colors.onPrimary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Removable Tag Cloud */}
            <View style={styles.skillsCloud}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  variant="tag"
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
            </View>
          </Card>

          {/* Weekly Schedule Availability Picker */}
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Icon name="calendar_month" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Weekly Availability</Text>
            </View>

            {/* Day Chips */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Active Working Days</Text>
            <View style={styles.daysGrid}>
              {DAYS.map((d) => {
                const isActive = activeDays.includes(d.key);
                return (
                  <TouchableOpacity
                    key={d.key}
                    activeOpacity={0.8}
                    onPress={() => toggleDay(d.key)}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isActive ? colors.primaryContainer : colors.surfaceSecondary,
                        borderColor: isActive ? colors.primaryContainer : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: isActive ? colors.onPrimary : colors.onSurface },
                      ]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preferred Time Windows */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface, marginTop: Spacing.sm }]}>
              Time Slots Available
            </Text>
            <View style={styles.timeSlotsCol}>
              {/* Morning */}
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasMorning }}
                activeOpacity={0.8}
                onPress={() => setHasMorning((prev) => !prev)}
                style={[
                  styles.timeSlotRow,
                  {
                    backgroundColor: hasMorning ? colors.paidBg : colors.surfaceSecondary,
                    borderColor: hasMorning ? colors.primaryContainer : colors.border,
                  },
                ]}>
                <View style={styles.timeSlotLeft}>
                  <Text style={[styles.timeSlotTitle, { color: colors.onSurface }]}>Mornings</Text>
                  <Text style={[styles.timeSlotHours, { color: colors.onSurfaceVariant }]}>
                    8:00 AM – 12:00 PM
                  </Text>
                </View>
                <Icon
                  name={hasMorning ? 'check_circle' : 'radio_button_unchecked'}
                  size={18}
                  color={hasMorning ? colors.primaryContainer : colors.outline}
                />
              </TouchableOpacity>

              {/* Afternoon */}
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasAfternoon }}
                activeOpacity={0.8}
                onPress={() => setHasAfternoon((prev) => !prev)}
                style={[
                  styles.timeSlotRow,
                  {
                    backgroundColor: hasAfternoon ? colors.paidBg : colors.surfaceSecondary,
                    borderColor: hasAfternoon ? colors.primaryContainer : colors.border,
                  },
                ]}>
                <View style={styles.timeSlotLeft}>
                  <Text style={[styles.timeSlotTitle, { color: colors.onSurface }]}>Afternoons</Text>
                  <Text style={[styles.timeSlotHours, { color: colors.onSurfaceVariant }]}>
                    12:00 PM – 5:00 PM
                  </Text>
                </View>
                <Icon
                  name={hasAfternoon ? 'check_circle' : 'radio_button_unchecked'}
                  size={18}
                  color={hasAfternoon ? colors.primaryContainer : colors.outline}
                />
              </TouchableOpacity>

              {/* Evening */}
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasEvening }}
                activeOpacity={0.8}
                onPress={() => setHasEvening((prev) => !prev)}
                style={[
                  styles.timeSlotRow,
                  {
                    backgroundColor: hasEvening ? colors.paidBg : colors.surfaceSecondary,
                    borderColor: hasEvening ? colors.primaryContainer : colors.border,
                  },
                ]}>
                <View style={styles.timeSlotLeft}>
                  <Text style={[styles.timeSlotTitle, { color: colors.onSurface }]}>Evenings</Text>
                  <Text style={[styles.timeSlotHours, { color: colors.onSurfaceVariant }]}>
                    5:00 PM – 9:00 PM
                  </Text>
                </View>
                <Icon
                  name={hasEvening ? 'check_circle' : 'radio_button_unchecked'}
                  size={18}
                  color={hasEvening ? colors.primaryContainer : colors.outline}
                />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Portfolio Samples Management */}
          <Card style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Icon name="collections" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Portfolio Samples</Text>
              </View>

              {portfolio.length > 0 && <View style={styles.portfolioGrid}>
                {portfolio.map((item) => (
                  <View
                    key={item._id}
                    style={[styles.portfolioCard, { borderColor: colors.border }]}>
                    <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${item.title}`}
                      onPress={() => handleDeletePortfolio(item._id)}
                      style={[styles.deleteBtn, { backgroundColor: colors.alertBg }]}>
                      <Icon name="delete" size={14} color={colors.alertText} />
                    </TouchableOpacity>
                    <View style={styles.portfolioCardFooter}>
                      <Text style={[styles.portfolioCardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>}

              {portfolio.length < MAX_PORTFOLIO_ITEMS && !selectedImage && (
                <View style={styles.portfolioActions}>
                  <Button title="Browse Photos" variant="outline" leftIcon="add_photo_alternate" onPress={() => choosePortfolioImage('library')} style={styles.portfolioAction} />
                  <Button title="Use Camera" variant="outline" leftIcon="photo_camera" onPress={() => choosePortfolioImage('camera')} style={styles.portfolioAction} />
                </View>
              )}

              {selectedImage && (
                <View style={[styles.selectedPortfolioForm, isNarrow && styles.selectedPortfolioFormNarrow, { borderColor: colors.border, backgroundColor: colors.canvas }]}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedPortfolioPreview} />
                  <View style={styles.selectedPortfolioFields}>
                    <Input label="Sample title" value={portfolioTitle} onChangeText={setPortfolioTitle} maxLength={100} />
                    <Textarea label="Description (optional)" value={portfolioDescription} onChangeText={setPortfolioDescription} maxLength={300} rows={2} />
                    <View style={styles.portfolioActions}>
                      <Button title="Cancel" variant="outline" onPress={() => setSelectedImage(null)} disabled={uploadingPortfolio} style={styles.portfolioAction} />
                      <Button title="Upload sample" loading={uploadingPortfolio} onPress={uploadPortfolioImage} style={styles.portfolioAction} />
                    </View>
                  </View>
                </View>
              )}
            </Card>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
              <Icon name="error" size={16} color={colors.alertText} />
              <Text style={[styles.errorBannerText, { color: colors.alertText }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Save Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title="Save Changes"
          rightIcon="check"
          loading={saving}
          onPress={handleSaveChanges}
          style={styles.saveBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: 90,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  avatarCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  avatarCenterCol: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: BorderRadius.full },
  avatarActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  avatarLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarRole: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  areaPickerBlock: {
    marginBottom: Spacing.md,
  },
  areaOptionsWrap: {
    gap: Spacing.xs,
  },
  areaOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  areaOptionText: {
    fontSize: 13,
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  skillInputCol: {
    flex: 1,
  },
  addSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    height: 44,
    gap: 4,
  },
  addSkillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  dayButton: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeSlotsCol: {
    gap: Spacing.xs,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeSlotTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeSlotHours: {
    fontSize: 11,
    marginTop: 1,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  portfolioActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  portfolioAction: {
    flex: 1,
  },
  selectedPortfolioForm: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  selectedPortfolioPreview: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.sm,
  },
  selectedPortfolioFields: {
    flex: 1,
  },
  portfolioCard: {
    width: '48%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: 90,
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPortfolioFormNarrow: { alignItems: 'flex-start', flexDirection: 'column' },
  portfolioCardFooter: {
    padding: Spacing.xs,
  },
  portfolioCardTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorBannerText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm + 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  saveBtn: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
});

