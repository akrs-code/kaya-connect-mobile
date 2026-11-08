/**
 * @file onboarding-context.tsx
 * @description State machine for managing multi-step onboarding wizard draft data across
 * Step 1 (Role/Location), Step 2 (Skills/Experience), and Step 3 (Schedule/Portfolio) before committing to backend.
 */

import React, { createContext, useContext, useState } from 'react';
import { AvailabilitySlot, DayOfWeek, UpdateProfileDto } from '@/api/types';
import { usersService } from '@/api/services/users.service';
import { useAuth } from './auth-context';

export type UserIntent = 'provider' | 'requester' | 'both';

export interface OnboardingDraft {
  intent: UserIntent;
  serviceArea: string;
  biography: string;
  skills: string[];
  experience: string;
  availableDays: DayOfWeek[];
  timeWindows: string[];
}

interface OnboardingContextType {
  draft: OnboardingDraft;
  setIntent: (intent: UserIntent) => void;
  setServiceArea: (area: string) => void;
  setBiography: (bio: string) => void;
  toggleSkill: (skill: string) => void;
  addCustomSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setExperience: (exp: string) => void;
  toggleDay: (day: DayOfWeek) => void;
  toggleTimeWindow: (window: string) => void;
  submitProfile: () => Promise<void>;
  resetDraft: () => void;
}

const defaultDraft: OnboardingDraft = {
  intent: 'provider',
  serviceArea: 'MSU Main Campus - Dorms/Halls',
  biography: '',
  skills: [],
  experience: '',
  availableDays: ['mon', 'wed', 'fri'],
  timeWindows: ['afternoons'],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const { refreshProfile } = useAuth();

  const setIntent = (intent: UserIntent) => {
    setDraft((prev) => ({ ...prev, intent }));
  };

  const setServiceArea = (serviceArea: string) => {
    setDraft((prev) => ({ ...prev, serviceArea }));
  };

  const setBiography = (biography: string) => {
    setDraft((prev) => ({ ...prev, biography }));
  };

  const toggleSkill = (skill: string) => {
    const normalized = skill.trim().toLowerCase();
    setDraft((prev) => {
      const exists = prev.skills.includes(normalized);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== normalized)
          : [...prev.skills, normalized],
      };
    });
  };

  const addCustomSkill = (skill: string) => {
    const normalized = skill.trim().toLowerCase();
    if (!normalized) return;
    setDraft((prev) => {
      if (prev.skills.includes(normalized)) return prev;
      return { ...prev, skills: [...prev.skills, normalized] };
    });
  };

  const removeSkill = (skill: string) => {
    const normalized = skill.trim().toLowerCase();
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== normalized),
    }));
  };

  const setExperience = (experience: string) => {
    setDraft((prev) => ({ ...prev, experience }));
  };

  const toggleDay = (day: DayOfWeek) => {
    setDraft((prev) => {
      const exists = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: exists
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day],
      };
    });
  };

  const toggleTimeWindow = (window: string) => {
    setDraft((prev) => {
      const exists = prev.timeWindows.includes(window);
      return {
        ...prev,
        timeWindows: exists
          ? prev.timeWindows.filter((w) => w !== window)
          : [...prev.timeWindows, window],
      };
    });
  };

  /**
   * Transforms accumulated draft data into backend UpdateProfileDto payload and persists to MongoDB.
   */
  const submitProfile = async () => {
    // Generate valid availability slots matching DAYS and HH:mm schema
    const availabilitySlots: AvailabilitySlot[] = [];
    const windowTimes: Record<string, { from: string; to: string }> = {
      mornings: { from: '08:00', to: '12:00' },
      afternoons: { from: '12:00', to: '17:00' },
      evenings: { from: '17:00', to: '21:00' },
      weekends: { from: '09:00', to: '18:00' },
    };

    const targetDays = draft.availableDays.length > 0 ? draft.availableDays : (['mon'] as DayOfWeek[]);
    const selectedWindows =
      draft.timeWindows.length > 0 ? draft.timeWindows : ['afternoons'];

    for (const day of targetDays) {
      for (const win of selectedWindows) {
        if (windowTimes[win] && availabilitySlots.length < 14) {
          availabilitySlots.push({
            day,
            from: windowTimes[win].from,
            to: windowTimes[win].to,
          });
        }
      }
    }

    const payload: UpdateProfileDto = {
      intent: draft.intent,
      biography: draft.biography.trim(),
      skills: draft.skills.map((s) => s.trim().toLowerCase()),
      serviceArea: [draft.serviceArea.trim().toLowerCase()],
      experience: draft.experience.trim()
        ? [{ title: 'Experience Summary', description: draft.experience.trim() }]
        : [],
      availability: availabilitySlots,
      visibility: {
        experience: true,
        availability: true,
        portfolio: true,
      },
    };

    await usersService.upsertProfile(payload);
    await refreshProfile();
  };

  const resetDraft = () => {
    setDraft(defaultDraft);
  };

  return (
    <OnboardingContext.Provider
      value={{
        draft,
        setIntent,
        setServiceArea,
        setBiography,
        toggleSkill,
        addCustomSkill,
        removeSkill,
        setExperience,
        toggleDay,
        toggleTimeWindow,
        submitProfile,
        resetDraft,
      }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

