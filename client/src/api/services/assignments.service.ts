/**
 * @file assignments.service.ts
 * @description API service for the full assignment lifecycle.
 *
 * Why: Assignments have a multi-step state machine driven by both requester and provider.
 * Agreement negotiation uses a versioned proposal/accept/reject flow.
 * Work execution transitions through: agreed → in_progress → completion_pending → completed.
 * Each method maps 1-to-1 with a backend endpoint; no extra abstraction is added.
 */

import { client } from '../core/client';
import { AgreementEvent, Assignment } from '../types';

export const assignmentsService = {
  /** GET /assignments/mine — all assignments where the current user is requester or provider */
  async listMine(): Promise<Assignment[]> {
    return client.get<Assignment[]>('/assignments/mine');
  },

  /**
   * GET /assignments/:id — full assignment record with agreedDetails and participant refs.
   * Both requester and provider may call this; non-participants get 404.
   * @param id Assignment _id
   */
  async getOne(id: string): Promise<Assignment> {
    return client.get<Assignment>(`/assignments/${id}`);
  },

  /**
   * GET /assignments/:id/agreement/history — chronological log of proposal/accept/reject events.
   * Used by the agreement screen to display the negotiation trail.
   * @param id Assignment _id
   */
  async agreementHistory(id: string): Promise<AgreementEvent[]> {
    return client.get<AgreementEvent[]>(`/assignments/${id}/agreement/history`);
  },

  /**
   * POST /assignments/:id/agreement/accept — provider accepts the current versioned proposal.
   * Requires body { version } matching the current agreementVersion on the assignment.
   * When both parties confirm the same version, status transitions to 'agreed'.
   * @param id Assignment _id
   * @param version Current agreementVersion from the assignment record
   */
  async acceptAgreement(id: string, version: number): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/agreement/accept`, { version });
  },

  /**
   * POST /assignments/:id/agreement/reject — provider rejects the current proposal.
   * Assignment stays at 'awaiting_agreement'; requester must re-propose.
   * @param id Assignment _id
   * @param version Current agreementVersion from the assignment record
   */
  async rejectAgreement(id: string, version: number): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/agreement/reject`, { version });
  },

  /**
   * PATCH /assignments/:id/status — transitions agreed assignment to in_progress.
   * Either party may start work once both have confirmed the agreement.
   * @param id Assignment _id
   */
  async startWork(id: string): Promise<Assignment> {
    return client.patch<Assignment>(`/assignments/${id}/status`, { status: 'in_progress' });
  },

  /**
   * POST /assignments/:id/completion/report — provider signals work is done.
   * Transitions status to completion_pending and notifies the requester to review.
   * @param id Assignment _id
   */
  async reportCompletion(id: string): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/completion/report`);
  },

  /**
   * POST /assignments/:id/completion/confirm — requester finalises completion.
   * Transitions status to completed and closes the linked opportunity.
   * @param id Assignment _id
   */
  async confirmCompletion(id: string): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/completion/confirm`);
  },

  /**
   * POST /assignments/:id/completion/concern — requester disputes the completion report.
   * Rolls status back to in_progress so the provider can address issues.
   * @param id Assignment _id
   */
  async raiseConcern(id: string): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/completion/concern`);
  },

  /**
   * POST /assignments/:id/cancel — either party cancels the assignment.
   * Valid from: awaiting_agreement, agreed, in_progress, completion_pending.
   * @param id Assignment _id
   */
  async cancel(id: string): Promise<Assignment> {
    return client.post<Assignment>(`/assignments/${id}/cancel`, {});
  },
};
