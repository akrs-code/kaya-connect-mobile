/**
 * @file notifications.service.ts
 * @description API service for the Notifications domain.
 *
 * Why: The backend exposes GET /notifications (list) and PATCH /notifications/:id/read
 * (mark single read). There is no mark-all-read endpoint, so the client must call
 * markRead for each unread notification when the user taps "Mark all read".
 */

import { client } from '../core/client';
import { Notification } from '../types';

export const notificationsService = {
  /** GET /notifications — the backend caps the result at 50, sorted newest first. */
  async list(): Promise<Notification[]> {
    return client.get<Notification[]>('/notifications');
  },

  /**
   * PATCH /notifications/:id/read — marks a single notification as read.
   * No mark-all endpoint exists; callers batch this per unread item.
   * @param id Notification _id
   */
  async markRead(id: string): Promise<Notification> {
    return client.patch<Notification>(`/notifications/${id}/read`);
  },
};
