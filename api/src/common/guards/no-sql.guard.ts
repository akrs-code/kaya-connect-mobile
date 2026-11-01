import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

const hasOperator = (v: any): boolean =>
  !!v &&
  typeof v === 'object' &&
  Object.entries(v).some(
    ([k, x]) => k.startsWith('$') || k.includes('.') || hasOperator(x),
  );

/** Rejects NoSQL-operator payloads such as {"email": {"$ne": null}}. Runs after body parsing (guards run after middleware). */
@Injectable()
export class NoSqlGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    if (
      hasOperator(req.body) ||
      hasOperator(req.query) ||
      hasOperator(req.params)
    )
      throw new BadRequestException('Invalid input');
    return true;
  }
}
