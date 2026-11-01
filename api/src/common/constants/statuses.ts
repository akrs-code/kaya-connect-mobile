export const OPP_TYPES = [
  'gig',
  'freelance',
  'part_time',
  'volunteer',
] as const;
export const OPP_STATUS = [
  'draft',
  'published',
  'assigned',
  'closed',
  'cancelled',
  'removed',
] as const;
export const APP_STATUS = [
  'submitted',
  'withdrawn',
  'selected',
  'declined',
] as const;
export const ASSIGNMENT_STATUS = [
  'awaiting_agreement',
  'agreed',
  'in_progress',
  'completion_pending',
  'completed',
  'cancelled',
] as const;
export const PAYMENT_STATUS = [
  'requester_declared_paid',
  'mutually_acknowledged',
] as const;
export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[number];
