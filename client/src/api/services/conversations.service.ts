/**
 * @file conversations.service.ts
 * @description API service for the Conversations & Messages domain.
 *
 * Why: Conversations are created automatically when a provider applies (applications.service).
 * This service only reads and sends within existing conversations — creation is application-side.
 * Message sending supports optional image upload via FormData because the backend uses
 * ImageUpload() interceptor on POST /conversations/:id/messages.
 */

import { client } from '../core/client';
import { Conversation, Message } from '../types';

export const conversationsService = {
  /**
   * GET /conversations — lists all conversations the current user participates in,
   * sorted by lastMessageAt descending. Participants are populated with fullName.
   */
  async list(): Promise<Conversation[]> {
    return client.get<Conversation[]>('/conversations');
  },

  /**
   * GET /conversations/:id/messages — returns messages for a conversation thread.
   * Uses cursor-based pagination via `before` (a message _id) for infinite scroll.
   * @param id Conversation _id
   * @param before Optional message _id cursor for pagination
   * @param limit Number of messages to return (default 30)
   */
  async getMessages(id: string, before?: string, limit = 30): Promise<Message[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    return client.get<Message[]>(`/conversations/${id}/messages?${params}`);
  },

  /**
   * POST /conversations/:id/messages — sends a text message.
   * Image upload is NOT wired here because React Native multipart upload
   * requires platform-specific FormData handling; images are deferred to a future implementation.
   * @param id Conversation _id
   * @param text Message body (required if no image)
   */
  async sendText(id: string, text: string): Promise<Message> {
    return client.post<Message>(`/conversations/${id}/messages`, { text });
  },
};

