/**
 * @file payments.types.ts
 * @description Direct peer-to-peer payment declaration and acknowledgment contracts.
 */

import { Assignment } from './assignments.types';

export type PaymentStatus = 'requester_declared_paid' | 'mutually_acknowledged';

export interface Payment {
  _id: string;
  assignment: string | Assignment;
  agreedAmount: number;
  requesterDeclaredPaidAt?: string | null;
  providerConfirmedReceivedAt?: string | null;
  status: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

