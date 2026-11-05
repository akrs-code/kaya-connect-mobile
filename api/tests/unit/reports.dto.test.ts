import { createReportSchema } from '../../src/modules/reports/reports.dto';

describe('report request validation', () => {
  const validTargetId = '507f1f77bcf86cd799439011';

  it.each(['user', 'opportunity'])('allows reporting a %s', (targetType) => {
    expect(
      createReportSchema.safeParse({
        targetType,
        targetId: validTargetId,
        category: 'inappropriate',
        description: 'This violates the platform rules',
      }).success,
    ).toBe(true);
  });

  it.each(['message', 'review'])(
    'does not allow reporting a %s',
    (targetType) => {
      expect(
        createReportSchema.safeParse({
          targetType,
          targetId: validTargetId,
          category: 'inappropriate',
        }).success,
      ).toBe(false);
    },
  );

  it('requires a written reason for each report', () => {
    expect(
      createReportSchema.safeParse({
        targetType: 'user',
        targetId: validTargetId,
        category: 'inappropriate',
      }).success,
    ).toBe(false);
  });
});
