/**
 * @file reports.service.ts
 * @description API service for submitting safety infractions and policy reports.
 *
 * Why: Allows students to flag fraudulent listings, dorm safety concerns, harassment,
 * or Honor Code violations. Validated against the database and routed to student moderators.
 */

import { client } from '../core/client';
import { CreateReportDto, Report } from '../types';

export const reportsService = {
  /**
   * Files a confidential incident report against an opportunity listing or user account.
   * @param data Report target, category, and descriptive details
   */
  async create(data: CreateReportDto): Promise<Report> {
    return client.post<Report>('/reports', data);
  },
};

