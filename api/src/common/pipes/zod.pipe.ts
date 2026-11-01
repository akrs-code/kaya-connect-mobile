import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodTypeAny } from 'zod';

/** Usage: @Body(new ZodPipe(schema)). Unknown keys are stripped, which blocks mass assignment. */
export class ZodPipe implements PipeTransform {
  constructor(private schema: ZodTypeAny) {}
  transform(value: unknown) {
    const r = this.schema.safeParse(value);
    if (!r.success)
      throw new BadRequestException({
        message: 'Validation failed',
        errors: r.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    return r.data;
  }
}
