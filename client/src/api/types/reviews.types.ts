/**
 * @file reviews.types.ts
 * @description Post-task review contracts and submission payloads.
 */

import { Assignment } from './assignments.types';

export interface CreateReviewDto {
  rating: number; // 1 to 5
  comment?: string;
}

export interface Review {
  _id: string;
  assignment: string | Assignment;
  reviewer: string | { _id: string; fullName: string };
  reviewee: string | { _id: string; fullName: string };
  rating: number;
  comment?: string;
  moderationStatus?: 'visible' | 'hidden';
  createdAt: string;
}

