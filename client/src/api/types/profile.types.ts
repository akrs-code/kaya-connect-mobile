/**
 * @file profile.types.ts
 * @description User profile, portfolio, schedule, and visibility contracts.
 */

import { User } from './common.types';

export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface AvailabilitySlot {
  day: DayOfWeek;
  from: string; // HH:mm format
  to: string;   // HH:mm format
}

export interface ExperienceItem {
  title: string;
  description?: string;
  years?: number;
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt?: string;
}

export interface ProfileVisibility {
  experience?: boolean;
  availability?: boolean;
  portfolio?: boolean;
}

export interface UserProfile {
  _id?: string;
  user: string;
  biography?: string;
  intent?: 'provider' | 'requester' | 'both';
  skills: string[];
  experience?: ExperienceItem[];
  availability?: AvailabilitySlot[];
  serviceArea: string[];
  portfolio?: PortfolioItem[];
  visibility?: ProfileVisibility;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

export interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  memberSince?: string;
  biography?: string;
  skills: string[];
  serviceArea: string[];
  experience?: ExperienceItem[];
  availability?: AvailabilitySlot[];
  portfolio?: PortfolioItem[];
  reviewSummary?: {
    averageRating: number;
    totalReviews: number;
  };
}

export interface UpdateProfileDto {
  intent?: 'provider' | 'requester' | 'both';
  biography?: string;
  skills?: string[];
  experience?: ExperienceItem[];
  availability?: AvailabilitySlot[];
  serviceArea?: string[];
  visibility?: ProfileVisibility;
}

