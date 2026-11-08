/**
 * @file assignments.types.ts
 * @description Formal task assignment contracts, versions, and audit events.
 */

import { Opportunity } from './opportunities.types';
import { User } from './common.types';

export type AssignmentStatus =
  | 'awaiting_agreement'
  | 'agreed'
  | 'in_progress'
  | 'completion_pending'
  | 'completed'
  | 'cancelled';

export interface AgreedDetails {
  description?: string;
  schedule?: { start: string; end: string };
  location?: string;
  compensationType?: 'paid' | 'unpaid';
  compensationAmount?: number;
  compensationUnit?: 'per_task' | 'per_hour';
}

export interface Assignment {
  _id: string;
  id?: string;
  opportunity: string | Partial<Opportunity>;
  requester: string | Partial<User>;
  provider: string | Partial<User>;
  status: AssignmentStatus;
  agreementVersion?: number;
  agreedDetails?: AgreedDetails;
  requesterConfirmedAt?: string | null;
  providerConfirmedAt?: string | null;
  providerReportedCompleteAt?: string | null;
  requesterConfirmedCompleteAt?: string | null;
  isActive?: boolean;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementEvent {
  _id: string;
  assignment: string;
  version: number;
  actor: string;
  eventType: 'proposed' | 'confirmed' | 'rejected';
  agreementSnapshot?: AgreedDetails;
  createdAt: string;
}

