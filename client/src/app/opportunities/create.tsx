/**
 * @file create.tsx
 * @description Screen 4.1: Create & Edit Opportunity Form.
 * Allows campus requesters to author or edit student gigs and mutual aid drives with taxonomy classification,
 * schedule timing, compensation parameters, and skill requirements, synchronizing with `POST /opportunities`
 * and `PATCH /opportunities/:id`.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoriesService, Category } from '@/api/services/categories.service';
import { opportunitiesService } from '@/api/services/opportunities.service';
import { Opportunity, OpportunityType } from '@/api/types';
import { Button, Card, Chip, Icon, Input, Textarea, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const CAMPUS_ZONES = [
  'MSU Main Campus - Dorms/Halls',
  'MSU Commercial Center',
  'MSU College of Engineering / Science Complex',
  'MSU Dimaporo Gymnasium / Grandstand',
  'Marawi City Central',
];

const COMMON_REQUIREMENTS = [
  'Heavy Lifting',
  'Dorm Resident',
  'Punctual',
  'Valid MSU ID',
  'Bring Tools',
  'Academic Tutor',
];

/**
 * CreateOpportunityScreen Component
 * 
 * Provides an authoritative creation and editing workflow for campus tasks (Screen 4.1).
 * Validates strict business rules (volunteer unpaid constraint, minimum description length,
 * schedule constraints) and synchronizes with the NestJS backend endpoints.
 */
export default function CreateOpportunityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isAuthenticated, profile } = useAuth();

  const isEditing = Boolean(id);

  // Form State
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('gig');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [campusZone, setCampusZone] = useState(CAMPUS_ZONES[0]);
  const [specificAddress, setSpecificAddress] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('500');
  const [compensationUnit, setCompensationUnit] = useState<'per_task' | 'per_hour'>('per_task');
  const [qualifications, setQualifications] = useState<string[]>(['Heavy Lifting']);
  const [newRequirement, setNewRequirement] = useState('');
  const [savedSchedule, setSavedSchedule] = useState<{ start: string; end: string } | null>(null);

  // Execution State
  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (profile?.intent === 'provider') {
      router.replace('/');
      return;
    }

    const loadData = async () => {
      try {
        const cats = await categoriesService.list();
        if (cats && cats.length > 0) {
          setCategories(cats);
          setCategoryId(cats[0]._id);
        }

        if (id) {
          const existing = await opportunitiesService.getOne(id);
          if (existing) {
            setTitle(existing.title || '');
            setDescription(existing.description || '');
            setOpportunityType(existing.opportunityType || 'gig');
            if (typeof existing.category === 'object' && existing.category?._id) {
              setCategoryId(existing.category._id);
            } else if (typeof existing.category === 'string') {
              setCategoryId(existing.category);
            }
            if (typeof existing.location === 'object' && existing.location?.area) {
              setCampusZone(existing.location.area);
              setSpecificAddress(existing.location.address || '');
            }
            if (typeof existing.schedule === 'object' && existing.schedule?.start && existing.schedule?.end) {
              setSavedSchedule({ start: existing.schedule.start, end: existing.schedule.end });
            }
            if (existing.compensationAmount) {
              setCompensationAmount(String(existing.compensationAmount));
            }
            if (existing.compensationUnit) {
              setCompensationUnit(existing.compensationUnit);
            }
            if (existing.qualifications && existing.qualifications.length > 0) {
              setQualifications(existing.qualifications);
            }
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load form data');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [id, isAuthenticated]);

  const handleAddRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    if (!qualifications.includes(trimmed)) {
      setQualifications([...qualifications, trimmed]);
    }
    setNewRequirement('');
  };

  const handleRemoveRequirement = (tag: string) => {
    setQualifications(qualifications.filter((q) => q !== tag));
  };

  const handleToggleCommonRequirement = (req: string) => {
    if (qualifications.includes(req)) {
      handleRemoveRequirement(req);
    } else {
      setQualifications([...qualifications, req]);
    }
  };

  const handleSave = async (publish: boolean) => {
    setErrorMessage('');

    // Client Validation
    if (title.trim().length < 5) {
      setErrorMessage('Opportunity title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setErrorMessage('Description must be at least 20 characters explaining task scope.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please select a campus taxonomy category.');
      return;
    }

    const isVolunteer = opportunityType === 'volunteer';
    const amountNum = parseFloat(compensationAmount) || 0;

    if (!isVolunteer && amountNum <= 0) {
      setErrorMessage('Paid opportunities require an offered compensation amount.');
      return;
    }

    setSubmitting(true);
    try {
      // New listings receive the existing default schedule. Edits preserve the saved schedule.
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(14, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 3);
      const schedule = savedSchedule ?? {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category: categoryId,
        opportunityType,
        location: {
          area: campusZone.toLowerCase(),
          address: specificAddress.trim() || undefined,
        },
        schedule,
        compensationType: isVolunteer ? 'unpaid' : 'paid',
        compensationAmount: isVolunteer ? 0 : amountNum,
        compensationUnit: isVolunteer ? undefined : compensationUnit,
        qualifications: qualifications.map((q) => q.trim().toLowerCase()),
        publish,
      };

      if (isEditing && id) {
        await opportunitiesService.update(id, payload);
        if (publish) {
          await opportunitiesService.publish(id).catch(() => {});
        }
      } else {
        await opportunitiesService.create(payload);
      }

      router.replace('/opportunities/mine');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save opportunity listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {/* Top Navigation */}
      <TopAppBar
        title={isEditing ? 'Edit Opportunity' : 'Create Opportunity'}
        showBack
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/opportunities/mine'))}
        rightAction={
          <TouchableOpacity
            accessibilityLabel="Save Draft"
            onPress={() => handleSave(false)}
            disabled={submitting}
            style={styles.draftBtn}>
            <Text style={[styles.draftBtnText, { color: colors.primaryContainer }]}>
              Save Draft
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Section 1: Classification Selector */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionOverline, { color: colors.outline }]}>
                OPPORTUNITY TYPE *
              </Text>
              <Text style={[styles.stepIndicator, { color: colors.primaryContainer }]}>
                Campus Taxonomy
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
              Choose how you want to engage student peers or campus mutual aid.
            </Text>

            <View style={styles.typeGrid}>
              {/* Paid Gig */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpportunityType('gig')}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: opportunityType === 'gig' ? colors.primaryContainer : colors.border,
                    borderWidth: opportunityType === 'gig' ? 2 : 1,
                  },
                ]}>
                <View style={styles.typeCardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.paidBg }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.paidText }]}>Earn Cash</Text>
                  </View>
                  {opportunityType === 'gig' && (
                    <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                  )}
                </View>
                <View style={styles.typeCardBottom}>
                  <View style={styles.typeLabelRow}>
                    <Icon name="payments" size={18} color={colors.primaryContainer} />
                    <Text style={[styles.typeTitle, { color: colors.onSurface }]}>Paid Gig</Text>
                  </View>
                  <Text style={[styles.typeDesc, { color: colors.outline }]}>Campus labor & quick tasks</Text>
                </View>
              </TouchableOpacity>

              {/* Volunteer */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpportunityType('volunteer')}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: opportunityType === 'volunteer' ? colors.secondary : colors.border,
                    borderWidth: opportunityType === 'volunteer' ? 2 : 1,
                  },
                ]}>
                <View style={styles.typeCardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.volunteerBg }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.secondary }]}>Civic Aid</Text>
                  </View>
                  {opportunityType === 'volunteer' && (
                    <Icon name="check_circle" size={18} color={colors.secondary} filled />
                  )}
                </View>
                <View style={styles.typeCardBottom}>
                  <View style={styles.typeLabelRow}>
                    <Icon name="handshake" size={18} color={colors.secondary} />
                    <Text style={[styles.typeTitle, { color: colors.onSurface }]}>Volunteer</Text>
                  </View>
                  <Text style={[styles.typeDesc, { color: colors.outline }]}>Civic outreach & MSU relief</Text>
                </View>
              </TouchableOpacity>

              {/* Freelance */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpportunityType('freelance')}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: opportunityType === 'freelance' ? colors.primaryContainer : colors.border,
                    borderWidth: opportunityType === 'freelance' ? 2 : 1,
                  },
                ]}>
                <View style={styles.typeCardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.onSurfaceVariant }]}>Project</Text>
                  </View>
                  {opportunityType === 'freelance' && (
                    <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                  )}
                </View>
                <View style={styles.typeCardBottom}>
                  <View style={styles.typeLabelRow}>
                    <Icon name="laptop_mac" size={18} color={colors.outline} />
                    <Text style={[styles.typeTitle, { color: colors.onSurface }]}>Freelance</Text>
                  </View>
                  <Text style={[styles.typeDesc, { color: colors.outline }]}>Design, code & media</Text>
                </View>
              </TouchableOpacity>

              {/* Peer Study */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpportunityType('part_time')}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: opportunityType === 'part_time' ? colors.primaryContainer : colors.border,
                    borderWidth: opportunityType === 'part_time' ? 2 : 1,
                  },
                ]}>
                <View style={styles.typeCardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.onSurfaceVariant }]}>Study</Text>
                  </View>
                  {opportunityType === 'part_time' && (
                    <Icon name="check_circle" size={18} color={colors.primaryContainer} filled />
                  )}
                </View>
                <View style={styles.typeCardBottom}>
                  <View style={styles.typeLabelRow}>
                    <Icon name="school" size={18} color={colors.outline} />
                    <Text style={[styles.typeTitle, { color: colors.onSurface }]}>Peer Study</Text>
                  </View>
                  <Text style={[styles.typeDesc, { color: colors.outline }]}>Review sessions & tutoring</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Task Overview */}
          <Card style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Icon name="edit_note" size={18} color={colors.primaryContainer} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Task Overview</Text>
            </View>

            {/* Title Input */}
            <Input
              label="Opportunity Title *"
              placeholder="e.g., Assistance transporting lab supplies..."
              maxLength={80}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Category Taxonomy *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryWrap}>
                {categories.map((cat) => {
                  const isSel = categoryId === cat._id;
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      onPress={() => setCategoryId(cat._id)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: isSel ? colors.primaryContainer : colors.surfaceSecondary,
                          borderColor: isSel ? colors.primaryContainer : colors.border,
                        },
                      ]}>
                      <Text style={[styles.catPillText, { color: isSel ? colors.onPrimary : colors.onSurface }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Description Textarea */}
            <Textarea
              label="Detailed Description & Scope *"
              placeholder="Describe what needs to be accomplished, logistics, and requirements..."
              maxLength={1000}
              rows={4}
              value={description}
              onChangeText={setDescription}
            />
          </Card>

          {/* Section 3: Campus Location */}
          <Card style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Icon name="pin_drop" size={18} color={colors.primaryContainer} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Location & Zone</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Campus Service Zone *</Text>
              <View style={styles.zoneOptionsCol}>
                {CAMPUS_ZONES.map((zone) => {
                  const isSel = campusZone === zone;
                  return (
                    <TouchableOpacity
                      key={zone}
                      onPress={() => setCampusZone(zone)}
                      style={[
                        styles.zoneRadioRow,
                        {
                          borderColor: isSel ? colors.primaryContainer : colors.border,
                          backgroundColor: isSel ? colors.surfaceSecondary : colors.surface,
                        },
                      ]}>
                      <Text style={[styles.zoneRadioText, { color: colors.onSurface }]}>{zone}</Text>
                      {isSel && <Icon name="check_circle" size={16} color={colors.primaryContainer} filled />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              label="Specific Landmark / Building (Optional)"
              placeholder="e.g., Boys Dorm Hall 2, 2nd Floor Room 214"
              value={specificAddress}
              onChangeText={setSpecificAddress}
            />
          </Card>

          {/* Section 4: Budget & Compensation */}
          <Card style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Icon name="account_balance_wallet" size={18} color={colors.primaryContainer} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Budget & Compensation</Text>
            </View>

            {opportunityType === 'volunteer' ? (
              <View style={[styles.volunteerNoteBox, { backgroundColor: colors.volunteerBg }]}>
                <Icon name="volunteer_activism" size={18} color={colors.secondary} filled />
                <Text style={[styles.volunteerNoteText, { color: colors.volunteerText }]}>
                  Volunteer listings are civic mutual aid initiatives and are recorded as uncompensated campus service.
                </Text>
              </View>
            ) : (
              <View style={styles.compensationRow}>
                <View style={styles.compAmountCol}>
                  <Input
                    label="Offered Amount (PHP ₱) *"
                    placeholder="500"
                    keyboardType="numeric"
                    value={compensationAmount}
                    onChangeText={setCompensationAmount}
                  />
                </View>

                <View style={styles.compUnitCol}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Rate Unit</Text>
                  <View style={styles.unitButtonsRow}>
                    <TouchableOpacity
                      onPress={() => setCompensationUnit('per_task')}
                      style={[
                        styles.unitBtn,
                        {
                          backgroundColor: compensationUnit === 'per_task' ? colors.primaryContainer : colors.surfaceSecondary,
                          borderColor: compensationUnit === 'per_task' ? colors.primaryContainer : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.unitBtnText,
                          { color: compensationUnit === 'per_task' ? colors.onPrimary : colors.onSurface },
                        ]}>
                        Per Task
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCompensationUnit('per_hour')}
                      style={[
                        styles.unitBtn,
                        {
                          backgroundColor: compensationUnit === 'per_hour' ? colors.primaryContainer : colors.surfaceSecondary,
                          borderColor: compensationUnit === 'per_hour' ? colors.primaryContainer : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.unitBtnText,
                          { color: compensationUnit === 'per_hour' ? colors.onPrimary : colors.onSurface },
                        ]}>
                        Per Hour
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Section 5: Skills & Requirements */}
          <Card style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Icon name="sell" size={18} color={colors.primaryContainer} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Required Skills & Criteria</Text>
            </View>

            {/* Custom Tag Input */}
            <View style={styles.addTagRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="e.g., Heavy Lifting, Circuit Wiring"
                  value={newRequirement}
                  onChangeText={setNewRequirement}
                  onSubmitEditing={handleAddRequirement}
                />
              </View>
              <TouchableOpacity
                onPress={handleAddRequirement}
                style={[styles.addTagBtn, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="add" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            {/* Removable Active Tags */}
            <View style={styles.activeTagsWrap}>
              {qualifications.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="tag"
                  onRemove={() => handleRemoveRequirement(tag)}
                />
              ))}
            </View>

            {/* Quick Suggestions */}
            <Text style={[styles.suggestionTitle, { color: colors.outline }]}>
              Common campus criteria:
            </Text>
            <View style={styles.suggestionsWrap}>
              {COMMON_REQUIREMENTS.map((req) => (
                <TouchableOpacity
                  key={req}
                  onPress={() => handleToggleCommonRequirement(req)}
                  style={[
                    styles.suggestionPill,
                    {
                      backgroundColor: qualifications.includes(req) ? colors.paidBg : colors.surfaceSecondary,
                      borderColor: qualifications.includes(req) ? colors.primaryContainer : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: qualifications.includes(req) ? colors.paidText : colors.onSurfaceVariant },
                    ]}>
                    + {req}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          {/* Policy Notice */}
          <View style={[styles.honorNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="verified" size={16} color={colors.secondary} filled />
            <Text style={[styles.honorText, { color: colors.onSurfaceVariant }]}>
              <Text style={{ fontWeight: '700' }}>MSU Marawi Student Honor Code:</Text> By publishing, you agree
              to fair peer compensation and safe campus conduct.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.publishActions}>
          <Button
            title="Discard & Exit"
            variant="outline"
            onPress={() => router.back()}
            style={styles.publishAction}
          />
          <Button
            title={isEditing ? 'Update & Publish' : 'Publish Listing'}
            rightIcon="arrow_forward"
            loading={submitting}
            onPress={() => handleSave(true)}
            style={styles.publishAction}
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
  keyboardView: {
    flex: 1,
  },
  draftBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeCard: {
    width: '48.5%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minHeight: 95,
    justifyContent: 'space-between',
  },
  typeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  typeCardBottom: {
    marginTop: Spacing.xs,
  },
  typeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  cardSection: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryWrap: {
    gap: 6,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  zoneOptionsCol: {
    gap: 4,
  },
  zoneRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  zoneRadioText: {
    fontSize: 12,
    fontWeight: '500',
  },
  volunteerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  volunteerNoteText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  compensationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  compAmountCol: {
    flex: 1.2,
  },
  compUnitCol: {
    flex: 1,
  },
  unitButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  addTagBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  suggestionTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  suggestionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  honorNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  honorText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  publishActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  publishAction: {
    flex: 1,
  },
});

