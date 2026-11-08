/**
 * @file reports.types.ts
 * @description Safety infraction reports and moderation compliance DTOs.
 */

export type ReportTargetType = 'opportunity' | 'user';
export type ReportCategory = 'inappropriate' | 'fraud' | 'harassment' | 'spam' | 'other';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description: string;
}

export interface ResolveReportDto {
  status: 'under_review' | 'resolved' | 'dismissed';
  note: string;
}

export interface Report {
  _id: string;
  reporter: string | { _id: string; fullName: string };
  targetType: ReportTargetType;
  targetId: string;
  target?: any;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditEvent {
  _id: string;
  actor: string | { _id: string; fullName: string };
  eventType: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditEventPage {
  items: AuditEvent[];
  total: number;
}

