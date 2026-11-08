/**
 * @file reviews.service.ts
 * @description API service for submitting post-task reviews.
 *
 * Why: To enforce trust and accountability across the campus community, mutual reviews
 * are permanently anchored to completed assignment contracts. The backend enforces that reviews
 * can only be created once the assignment reaches completed status.
 */

import { client } from '../core/client';
import { CreateReviewDto, Review } from '../types';

export const reviewsService = {
  /**
 * Submits a 1-5 star review and comment for a completed assignment.
   * The backend automatically identifies whether the submitter is the requester or provider
   * and links the review to the counterpart.
   * @param assignmentId Completed assignment ID
   * @param data Rating and optional feedback comment
   */
  async create(assignmentId: string, data: CreateReviewDto): Promise<Review> {
    return client.post<Review>(`/assignments/${assignmentId}/reviews`, data);
  },
};

