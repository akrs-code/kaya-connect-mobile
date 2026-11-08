/**
 * @file opportunities.service.ts
 * @description API service for creating, browsing, filtering, and managing gigs and volunteer opportunities.
 */

import { client } from '../core/client';
import { Opportunity, OpportunityType } from '../types';

export interface OpportunityQuery {
  page?: number;
  limit?: number;
  type?: OpportunityType;
  category?: string;
  q?: string;
  search?: string;
  area?: string;
  location?: string;
  compensationType?: 'paid' | 'unpaid';
}

export const opportunitiesService = {
  /**
   * Retrieves a paginated list of published gigs and volunteer opportunities.
   * @param query Optional filtering criteria (type, category, search query, location area)
   */
  async list(query?: OpportunityQuery): Promise<{ items: Opportunity[]; total: number }> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.type) params.append('type', query.type);
    if (query?.category) params.append('category', query.category);
    if (query?.q || query?.search) params.append('q', query.q || query.search!);
    if (query?.area || query?.location) params.append('area', query.area || query.location!);
    if (query?.compensationType) params.append('compensationType', query.compensationType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client.get(`/opportunities${queryString}`);
  },

  /**
   * Fetches the listings created by the authenticated requester.
   */
  async mine(): Promise<Opportunity[]> {
    return client.get<Opportunity[]>('/opportunities/mine');
  },

  /**
   * Fetches full details for a single opportunity.
   * @param id Opportunity ID
   */
  async getOne(id: string): Promise<Opportunity> {
    return client.get<Opportunity>(`/opportunities/${id}`);
  },

  /**
   * Creates a new draft opportunity.
   * @param data Creation payload
   */
  async create(data: Partial<Opportunity>): Promise<Opportunity> {
    return client.post<Opportunity>('/opportunities', data);
  },

  /**
   * Updates an existing opportunity listing.
   * @param id Opportunity ID
   * @param data Update payload
   */
  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    return client.patch<Opportunity>(`/opportunities/${id}`, data);
  },

  /**
   * Publishes an existing opportunity to make it visible across the community.
   * @param id Opportunity ID
   */
  async publish(id: string): Promise<Opportunity> {
    return client.post<Opportunity>(`/opportunities/${id}/publish`);
  },

  /**
   * Closes an opportunity to cease receiving applications.
   * @param id Opportunity ID
   */
  async close(id: string): Promise<Opportunity> {
    return client.post<Opportunity>(`/opportunities/${id}/close`);
  },
};

