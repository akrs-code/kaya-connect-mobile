/**
 * @file step-3.tsx
 * @description Screen 1.4: Onboarding Wizard Step 3 - Weekly Availability Schedule,
 * Preferred Academic Time Windows, and Portfolio Upload with endpoint submission.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayOfWeek } from '@/api/types';
import { usersService } from '@/api/services/users.service';
import { Badge, Button, Card, Chip, Icon, Input, Textarea, TopAppBar, WizardStepper } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/onboarding-context';
import { useAuth } from '@/context/auth-context';
import {
  createPortfolioFormData,
  MAX_PORTFOLIO_ITEMS,
  pickPortfolioImage,
  PortfolioImageSource,
  SelectedPortfolioImage,
} from '@/utils/portfolio-image';

const DAYS_OF_WEEK: Array<{ key: DayOfWeek; label: string; sub: string }> = [
  { key: 'mon', label: 'Mon', sub: 'M' },
  { key: 'tue', label: 'Tue', sub: 'T' },
  { key: 'wed', label: 'Wed', sub: 'W' },
  { key: 'thu', label: 'Thu', sub: 'T' },
  { key: 'fri', label: 'Fri', sub: 'F' },
  { key: 'sat', label: 'Sat', sub: 'S' },
  { key: 'sun', label: 'Sun', sub: 'S' },
];

const TIME_WINDOWS = [
  {
    id: 'mornings',
    title: 'Mornings',
    hours: '8:00 AM – 12:00 PM',
    icon: 'wb_twilight',
  },
  {
    id: 'afternoons',
    title: 'Afternoons',
    hours: '12:00 PM – 5:00 PM',
    icon: 'sunny',
  },
  {
    id: 'evenings',
    title: 'Evenings',
    hours: '5:00 PM – 9:00 PM',
    icon: 'dark_mode',
  },
  {
    id: 'weekends',
    title: 'Weekends Only',
    hours: 'Full Saturday / Sunday availability',
    icon: 'event_available',
  },
];

type QueuedPortfolioImage = {
  id: string;
  image: SelectedPortfolioImage;
  title: string;
  description: string;
  status: 'ready' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
};

const titleFromFileName = (fileName: string) => fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

/**
 * OnboardingStep3Screen Component
 * 
 * Final setup step in the onboarding sequence: configures recurring weekly availability schedule
 * and submits the consolidated profile payload to the NestJS backend via `PUT /users/me/profile`.
 */
export default function OnboardingStep3Screen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isNarrow = width <= 380;
  const {
    draft,
    toggleDay,
    toggleTimeWindow,
    submitProfile,
  } = useOnboarding();
  const { refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [queuedImages, setQueuedImages] = useState<QueuedPortfolioImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedPortfolioImage | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');

  const chooseImage = async (source: PortfolioImageSource) => {
    if (queuedImages.length >= MAX_PORTFOLIO_ITEMS) {
      setErrorMessage(`You can add up to ${MAX_PORTFOLIO_ITEMS} portfolio samples.`);
      return;
    }
    try {
      setErrorMessage('');
      const image = await pickPortfolioImage(source);
      if (!image) return;
      setSelectedImage(image);
      setImageTitle(titleFromFileName(image.fileName));
      setImageDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to select this image.');
    }
  };

  const addSelectedImage = () => {
    if (!selectedImage) return;
    if (!imageTitle.trim()) {
      setErrorMessage('Add a title before adding this portfolio sample.');
      return;
    }
    setQueuedImages((current) => [...current, {
      id: `${Date.now()}-${selectedImage.fileName}`,
      image: selectedImage,
      title: imageTitle.trim(),
      description: imageDescription.trim(),
      status: 'ready',
    }]);
    setSelectedImage(null);
    setImageTitle('');
    setImageDescription('');
  };

  const handleCompleteSetup = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      if (selectedImage) throw new Error('Add or discard the selected photo before completing setup.');
      await submitProfile();
      let hasUploadFailure = false;
      for (const item of queuedImages.filter((image) => image.status !== 'uploaded')) {
        setQueuedImages((current) => current.map((image) => image.id === item.id
          ? { ...image, status: 'uploading', error: undefined }
          : image));
        try {
          await usersService.addPortfolio(createPortfolioFormData(item.image, item.title, item.description));
          setQueuedImages((current) => current.map((image) => image.id === item.id
            ? { ...image, status: 'uploaded' }
            : image));
        } catch (err: any) {
          hasUploadFailure = true;
          setQueuedImages((current) => current.map((image) => image.id === item.id
            ? { ...image, status: 'failed', error: err.message || 'Upload failed' }
            : image));
        }
      }
      if (hasUploadFailure) throw new Error('Your profile was saved, but one or more photos failed to upload. Retry them below.');
      await refreshProfile();
      router.replace('/onboarding/complete');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Stepper Header (100% Filled for Step 3) */}
        <View style={styles.stepperContainer}>
          <WizardStepper
            step={3}
            totalSteps={3}
            stepTitle="Availability & Work Samples"
            percentage={100}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.mainHeadline, { color: colors.onSurface }]}>
            Availability and samples
          </Text>
          <Text style={[styles.bodyDescription, { color: colors.onSurfaceVariant }]}>
            Set when you are available.
          </Text>
        </View>

        {/* Section 1: Weekly Availability Picker */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="calendar_month" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Weekly Availability
              </Text>
            </View>
            <Text style={[styles.cardHeaderHint, { color: colors.onSurfaceVariant }]}>
              Tap to toggle
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>
            Select available days.
          </Text>

          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                subLabel={d.sub}
                variant="day"
                selected={draft.availableDays.includes(d.key)}
                onPress={() => toggleDay(d.key)}
              />
            ))}
          </View>
        </Card>

        {/* Section 2: Preferred Time Windows */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderLeft}>
            <Icon name="schedule" size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Available times
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>
            Select times that work for you.
          </Text>

          <View style={styles.timeWindowList}>
            {TIME_WINDOWS.map((win) => {
              const isChecked = draft.timeWindows.includes(win.id);
              return (
                <TouchableOpacity
                  key={win.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  activeOpacity={0.8}
                  onPress={() => toggleTimeWindow(win.id)}
                  style={[
                    styles.timeWindowRow,
                    {
                      backgroundColor: isChecked ? colors.paidBg : colors.surfaceSecondary,
                      borderColor: isChecked ? colors.primaryContainer : colors.border,
                      borderWidth: isChecked ? 1.5 : 1,
                    },
                  ]}>
                  <View style={styles.timeWindowLeft}>
                    <Icon
                      name={win.icon}
                      size={20}
                      color={isChecked ? colors.paidText : colors.onSurfaceVariant}
                    />
                    <View>
                      <Text
                        style={[
                          styles.timeWindowTitle,
                          {
                            color: colors.onSurface,
                            fontWeight: isChecked ? '600' : '500',
                          },
                        ]}>
                        {win.title}
                      </Text>
                      <Text
                        style={[
                          styles.timeWindowHours,
                          {
                            color: isChecked ? colors.paidText : colors.onSurfaceVariant,
                          },
                        ]}>
                        {win.hours}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: isChecked ? colors.primaryContainer : 'transparent',
                        borderColor: isChecked ? colors.primaryContainer : colors.border,
                      },
                    ]}>
                    {isChecked && <Icon name="check" size={14} color={colors.onPrimary} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Section 3: Portfolio Samples (Optional) */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="photo_library" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Work samples
              </Text>
            </View>
            <Badge label="Optional" variant="neutral" />
          </View>
          <Text style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>
            Optional photos of past work.
          </Text>

          {/* Upload Box */}
          <View
            style={[
              styles.uploadBox,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}>
            <View style={[styles.cameraBubble, { backgroundColor: colors.paidBg }]}>
              <Icon name="photo_camera" size={24} color={colors.paidText} />
            </View>
            <Text style={[styles.uploadHeading, { color: colors.onSurface }]}>Add a work sample</Text>
            <Text style={[styles.uploadSub, { color: colors.onSurfaceVariant }]}>
              Up to 5 MB each
            </Text>
            <View style={styles.uploadActions}>
              <TouchableOpacity onPress={() => chooseImage('library')} style={[styles.browseButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Icon name="add_photo_alternate" size={16} color={colors.primary} />
                <Text style={[styles.browseText, { color: colors.primary }]}>Browse Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => chooseImage('camera')} style={[styles.browseButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Icon name="photo_camera" size={16} color={colors.primary} />
                <Text style={[styles.browseText, { color: colors.primary }]}>Use Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedImage && (
            <View style={[styles.selectedImageForm, isNarrow && styles.selectedImageFormNarrow, { borderColor: colors.border, backgroundColor: colors.canvas }]}> 
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
              <View style={styles.selectedImageFields}>
                <Input label="Sample title" value={imageTitle} onChangeText={setImageTitle} maxLength={100} />
                <Textarea label="Description (optional)" value={imageDescription} onChangeText={setImageDescription} maxLength={300} rows={2} />
                <View style={styles.uploadActions}>
                  <Button title="Cancel" variant="outline" onPress={() => setSelectedImage(null)} style={styles.formAction} />
                  <Button title="Add sample" onPress={addSelectedImage} style={styles.formAction} />
                </View>
              </View>
            </View>
          )}

          {/* Thumbnail Preview Grid */}
          <View style={styles.thumbnailsSection}>
            <Text style={[styles.thumbnailsCount, { color: colors.onSurfaceVariant }]}>
              Portfolio samples ({queuedImages.length}/{MAX_PORTFOLIO_ITEMS})
            </Text>

            <View style={styles.thumbnailsGrid}>
              {queuedImages.map((item) => (
                <View key={item.id} style={[styles.thumbnailCard, { borderColor: colors.border }]}>
                  <Image
                    source={{ uri: item.image.uri }}
                    style={styles.thumbnailImg}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.title}`}
                    disabled={item.status === 'uploading'}
                    onPress={() => setQueuedImages((current) => current.filter((image) => image.id !== item.id))}
                    style={[styles.removeThumbBtn, { backgroundColor: colors.alertBg }]}>
                    <Icon name="close" size={14} color={colors.alertText} />
                  </TouchableOpacity>
                  <View style={styles.thumbLabelBadge}>
                    <Text style={styles.thumbLabelText} numberOfLines={1}>{item.status === 'uploaded' ? 'Uploaded' : item.status === 'failed' ? 'Retry pending' : item.title}</Text>
                  </View>
                </View>
              ))}

              {queuedImages.length < MAX_PORTFOLIO_ITEMS && <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => chooseImage('library')}
                style={[styles.emptySlot, { borderColor: colors.border, backgroundColor: colors.canvas }]}>
                <Icon name="add" size={20} color={colors.outline} />
                <Text style={[styles.emptySlotText, { color: colors.outline }]}>Add</Text>
              </TouchableOpacity>}
            </View>
          </View>
        </Card>

        {/* Error Feedback */}
        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
            <Icon name="error" size={16} color={colors.alertText} />
            <Text style={[styles.errorBannerText, { color: colors.alertText }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomBarContent}>
          <Button
            title="Back"
            variant="outline"
            leftIcon="arrow_back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Button
            title="Finish setup"
            rightIcon="check"
            loading={loading}
            onPress={handleCompleteSetup}
            style={styles.completeButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepperContainer: {
    marginBottom: Spacing.md,
  },
  heroSection: {
    marginBottom: Spacing.md,
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  bodyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardHeaderHint: {
    fontSize: 12,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  timeWindowList: {
    gap: Spacing.xs + 2,
  },
  timeWindowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  timeWindowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  timeWindowTitle: {
    fontSize: 14,
  },
  timeWindowHours: {
    fontSize: 12,
    marginTop: 2,
  },
  checkboxBox: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImageFormNarrow: { alignItems: 'flex-start', flexDirection: 'column' },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBubble: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  uploadHeading: {
    fontSize: 13,
    fontWeight: '600',
  },
  uploadSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  selectedImageForm: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  selectedImagePreview: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.sm,
  },
  selectedImageFields: {
    flex: 1,
  },
  formAction: {
    flex: 1,
  },
  browseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  thumbnailsSection: {
    marginTop: Spacing.md,
  },
  thumbnailsCount: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  thumbnailsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  thumbnailCard: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabelBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(15,23,42,0.45)',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  thumbLabelText: {
    color: '#fff',
    fontSize: 9,
  },
  emptySlot: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 10,
    marginTop: 2,
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
  bottomBarContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
});
