/**
 * @file notifications.types.ts
 * @description Real-time activity center notifications contract.
 */

export interface Notification {
  _id: string;
  user: string;
  type: string;
  message: string;
  read: boolean;
  refType?: 'assignment' | 'application' | 'conversation' | 'opportunity';
  refId?: string;
  createdAt: string;
}

