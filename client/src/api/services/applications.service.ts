/**
 * @file applications.service.ts
 * @description API service for submitting task applications, managing applicant selections, and tracking statuses.
 */

import { client } from '../core/client';
import { Application } from '../types';

export const applicationsService = {
  /**
   * Submits an application for a gig or volunteer task with an optional pitch note.
   * @param opportunityId Target opportunity ID
   * @param message Optional pitch message (max 500 characters)
   */
  async apply(opportunityId: string, message?: string): Promise<Application> {
    return client.post<Application>(`/opportunities/${opportunityId}/applications`, {
      message,
    });
  },

  /**
   * Retrieves all applications submitted by the current user.
   */
  async listMine(): Promise<Application[]> {
    return client.get<Application[]>('/applications/mine');
  },

  /**
   * Retrieves all applicants who submitted for a specific opportunity (requester view).
   * @param opportunityId Opportunity ID
   */
  async listForOpportunity(opportunityId: string): Promise<Application[]> {
    return client.get<Application[]>(`/opportunities/${opportunityId}/applications`);
  },

  /**
   * Withdraws a pending application before an applicant is chosen.
   * @param applicationId Application ID
   */
  async withdraw(applicationId: string): Promise<void> {
    return client.post(`/applications/${applicationId}/withdraw`);
  },

  /**
   * Selects an applicant to award the assignment and initiate the agreement workflow.
   * @param applicationId Application ID
   */
  async select(applicationId: string): Promise<{ assignmentId: string }> {
    return client.post<{ assignmentId: string }>(`/applications/${applicationId}/select`);
  },
};

