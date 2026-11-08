/**
 * @file conversations.types.ts
 * @description Direct peer-to-peer conversations, messages, and media attachments.
 */

export interface ConversationParticipant {
  _id: string;
  fullName: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  application: string;
  assignment?: string;
  lastMessageAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface MessageMedia {
  url: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  media: MessageMedia[];
  moderationStatus: 'visible' | 'hidden';
  createdAt: string;
}

