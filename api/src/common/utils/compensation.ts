import { BadRequestException } from '@nestjs/common';

// Shared business rules: plain functions, testable without HTTP (NFR-028)
export function assertCompensation(d: {
  compensationType: string;
  compensationAmount?: number;
  compensationUnit?: string;
}) {
  if (
    d.compensationType === 'paid' &&
    (!d.compensationAmount || d.compensationAmount <= 0 || !d.compensationUnit)
  )
    throw new BadRequestException('Paid listings need an amount and a unit');
  if (d.compensationType === 'unpaid' && d.compensationAmount)
    throw new BadRequestException('Unpaid listings cannot have an amount');
}
export function assertSchedule(s: { start: Date; end: Date }) {
  if (new Date(s.end) <= new Date(s.start))
    throw new BadRequestException('Schedule end must be after start');
}
