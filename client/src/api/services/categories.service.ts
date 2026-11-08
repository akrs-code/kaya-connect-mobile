/**
 * @file categories.service.ts
 * @description API service for retrieving campus opportunity taxonomy categories.
 */

import { client } from '../core/client';

export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
  description?: string;
}

export const categoriesService = {
  /**
   * Fetches all active opportunity categories for filtering and taxonomy tagging.
   */
  async list(): Promise<Category[]> {
    return client.get<Category[]>('/categories');
  },
};

