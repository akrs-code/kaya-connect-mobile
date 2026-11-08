/**
 * @file users.service.ts
 * @description API service methods for managing current user data, public profiles, and onboarding profile attributes.
 */

import { client } from '../core/client';
import {
  PublicProfile,
  PortfolioItem,
  UpdateProfileDto,
  User,
  UserProfile,
  UserWithProfile,
} from '../types';

export const usersService = {
  /**
   * Retrieves the authenticated user's account details and associated profile record.
   */
  async getMe(): Promise<UserWithProfile> {
    return client.get<UserWithProfile>('/users/me');
  },

  /**
   * Updates basic account information such as official full name.
   * @param data Payload containing new full name
   */
  async updateMe(data: { fullName: string }): Promise<User> {
    return client.patch<User>('/users/me', data);
  },

  /**
   * Upserts the user's profile with skills, service areas, bio, and availability slots.
   * Invoked upon completion of the Onboarding Wizard.
   * @param data Partial profile payload matching profileSchema
   */
  async upsertProfile(data: UpdateProfileDto): Promise<UserProfile> {
    return client.put<UserProfile>('/users/me/profile', data);
  },

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    return client.post<{ avatarUrl: string }>('/users/me/avatar', formData);
  },

  /**
   * Uploads a sample portfolio item with an attached photo.
   * @param formData Form data containing title, optional description, and file binary
   */
  async addPortfolio(formData: FormData): Promise<PortfolioItem> {
    return client.post<PortfolioItem>('/users/me/portfolio', formData);
  },

  /**
   * Removes a specific portfolio item by ID.
   * @param id Portfolio subdocument ID
   */
  async removePortfolio(id: string): Promise<void> {
    return client.delete(`/users/me/portfolio/${id}`);
  },

  /**
   * Fetches public profile details, skills, and ratings of any campus community member.
   * @param id Target user ID
   */
  async getPublicProfile(id: string): Promise<PublicProfile> {
    return client.get<PublicProfile>(`/users/${id}/profile`);
  },

  /**
   * Fetches the completed gig and task history for a user.
   * @param id Target user ID
   */
  async getHistory(id: string): Promise<any> {
    return client.get(`/users/${id}/history`);
  },

  /**
   * Retrieves paginated community reviews for a user.
   * @param id Target user ID
   */
  async getReviews(id: string): Promise<{ items: any[]; total: number }> {
    return client.get(`/users/${id}/reviews`);
  },
};

