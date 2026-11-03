import {
  appealDecisionSchema,
  moderationReasonSchema,
  resolveSchema,
} from '../../src/modules/admin/admin.dto';

describe('admin moderation request validation', () => {
  it('requires a reason for moderation actions', () => {
    expect(moderationReasonSchema.safeParse({}).success).toBe(false);
    expect(
      moderationReasonSchema.safeParse({ reason: 'Reviewed report' }).success,
    ).toBe(true);
  });

  it('requires report notes and accepts the review workflow statuses', () => {
    expect(resolveSchema.safeParse({ status: 'under_review' }).success).toBe(
      false,
    );
    expect(
      resolveSchema.safeParse({
        status: 'under_review',
        note: 'Investigating submitted evidence',
      }).success,
    ).toBe(true);
    expect(
      resolveSchema.safeParse({
        status: 'resolved',
        note: 'Violation was confirmed',
      }).success,
    ).toBe(true);
  });

  it('validates appeal decisions and their reasons', () => {
    expect(
      appealDecisionSchema.safeParse({
        decision: 'reinstate',
        note: 'Appeal accepted after review',
      }).success,
    ).toBe(true);
    expect(
      appealDecisionSchema.safeParse({ decision: 'reinstate' }).success,
    ).toBe(false);
  });
});
