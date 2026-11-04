import { ConflictException } from '@nestjs/common';
import { AssignmentStatus } from '../../common/constants/statuses';

const T: Record<AssignmentStatus, AssignmentStatus[]> = {
  awaiting_agreement: ['agreed', 'cancelled'],
  agreed: ['awaiting_agreement', 'in_progress', 'cancelled'], // back to awaiting only via a new agreement version
  in_progress: ['completion_pending', 'cancelled'],
  completion_pending: ['completed', 'in_progress', 'cancelled'], // in_progress = requester raised a concern
  completed: [],
  cancelled: [], // terminal: cannot be reopened
};
export const canTransition = (from: AssignmentStatus, to: AssignmentStatus) =>
  T[from].includes(to);
export function assertTransition(from: AssignmentStatus, to: AssignmentStatus) {
  if (!canTransition(from, to))
    throw new ConflictException(
      `Cannot change assignment from ${from} to ${to}`,
    );
}
