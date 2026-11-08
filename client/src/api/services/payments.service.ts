/**
 * @file payments.service.ts
 * @description API service for managing direct peer-to-peer payment acknowledgment.
 *
 * Why: KayaConnect operates an escrow/acknowledgment system where fiat is transferred
 * directly peer-to-peer (GCash, Maya, Cash). The requester declares that payment was sent,
 * and the provider confirms receipt. Both steps are recorded by the backend.
 */

import { client } from '../core/client';
import { Payment } from '../types';

export const paymentsService = {
  /**
   * Retrieves the current payment declaration/acknowledgment status for an assignment.
   * @param assignmentId ID of the assignment
   */
  async get(assignmentId: string): Promise<Payment | null> {
    return client.get<Payment | null>(`/assignments/${assignmentId}/payment`);
  },

  /**
   * Requester action declaring that payment has been disbursed to the provider.
   * @param assignmentId ID of the assignment
   */
  async declare(assignmentId: string): Promise<Payment> {
    return client.post<Payment>(`/assignments/${assignmentId}/payment/declare`);
  },

  /**
   * Provider action acknowledging and confirming receipt of the agreed compensation funds.
   * @param assignmentId ID of the assignment
   */
  async confirm(assignmentId: string): Promise<Payment> {
    return client.post<Payment>(`/assignments/${assignmentId}/payment/confirm`);
  },
};

