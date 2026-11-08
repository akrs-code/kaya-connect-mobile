/**
 * @file admin.service.ts
 * @description API service for administrators and moderation queues.
 *
 * Why: Provides privileged administrative triage routes for incident review, account sanctions,
 * listing removals, and report resolution compliance.
 */

import { client } from '../core/client';
import { AuditEventPage, Report, ResolveReportDto } from '../types';
import { Category } from './categories.service';

export const adminService = {
  /**
   * Lists reported incidents across the campus network with optional status filtering.
   * @param query Pagination and status filter options
   */
  async listReports(query?: { status?: string; page?: number; limit?: number }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return client.get<Report[]>(`/admin/reports${qs ? `?${qs}` : ''}`);
  },

  /**
   * Updates resolution status and records compliance audit notes on an incident report.
   * @param id Report document ID
   * @param data Resolution status and mandatory explanation note
   */
  async resolveReport(id: string, data: ResolveReportDto): Promise<Report> {
    return client.patch<Report>(`/admin/reports/${id}`, data);
  },

  /**
   * Administrative action to remove an illicit or unsafe opportunity listing from the marketplace.
   * @param id Opportunity listing ID
   * @param reason Administrative explanation reason
   */
  async removeOpportunity(id: string, reason: string): Promise<any> {
    return client.patch(`/admin/opportunities/${id}/remove`, { reason });
  },

  /**
   * Suspends an account after a verified policy violation.
   * @param id User ID
   * @param reason Policy violation justification
   */
  async suspendUser(id: string, reason: string): Promise<any> {
    return client.patch(`/admin/users/${id}/suspend`, { reason });
  },

  async listAuditEvents(query?: { eventType?: string; search?: string; days?: number; page?: number; limit?: number }): Promise<AuditEventPage> {
    const params = new URLSearchParams();
    if (query?.eventType) params.set('eventType', query.eventType);
    if (query?.search) params.set('search', query.search);
    if (query?.days) params.set('days', String(query.days));
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return client.get<AuditEventPage>(`/admin/audit-events${qs ? `?${qs}` : ''}`);
  },

  async listCategories(): Promise<Category[]> {
    return client.get<Category[]>('/admin/categories');
  },

  async createCategory(name: string): Promise<Category> {
    return client.post<Category>('/admin/categories', { name });
  },

  async updateCategory(id: string, data: Partial<Pick<Category, 'name' | 'isActive'>>): Promise<Category> {
    return client.patch<Category>(`/admin/categories/${id}`, data);
  },
};

