/**
 * @file opportunities.types.ts
 * @description Campus opportunities, gigs, voluntary aid, and compensation contracts.
 */

export type OpportunityType = 'gig' | 'freelance' | 'part_time' | 'volunteer';
export type OpportunityStatus =
  | 'draft'
  | 'published'
  | 'assigned'
  | 'closed'
  | 'cancelled'
  | 'removed';

export interface Compensation {
  amount: number;
  unit?: 'per_task' | 'per_hour' | 'fixed';
}

export interface OpportunityLocation {
  area: string;
  address?: string;
}

export interface OpportunitySchedule {
  start: string;
  end: string;
}

export interface OpportunityCategory {
  _id: string;
  name: string;
}

export interface Opportunity {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string | OpportunityCategory;
  opportunityType: OpportunityType;
  type?: OpportunityType;
  status: OpportunityStatus;
  location?: string | OpportunityLocation;
  schedule?: string | OpportunitySchedule;
  compensationType?: 'paid' | 'unpaid';
  compensationAmount?: number;
  compensationUnit?: 'per_task' | 'per_hour';
  compensation?: Compensation;
  qualifications?: string[];
  skillsRequired?: string[];
  requester: string | { _id: string; fullName: string; email?: string; [key: string]: any };
  createdAt: string;
  updatedAt: string;
}

