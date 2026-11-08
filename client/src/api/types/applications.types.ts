/**
 * @file applications.types.ts
 * @description Task applications submitted by campus providers.
 */

import { Opportunity } from './opportunities.types';
import { User } from './common.types';

export type ApplicationStatus = 'submitted' | 'withdrawn' | 'selected' | 'declined';

export interface Application {
  _id: string;
  id?: string;
  opportunity: string | Opportunity;
  provider: string | Partial<User>;
  applicant?: string | Partial<User>;
  message?: string;
  coverNote?: string;
  status: ApplicationStatus;
  active?: boolean;
  assignmentId?: string;
  createdAt: string;
  updatedAt?: string;
}

