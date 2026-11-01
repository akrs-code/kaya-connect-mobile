import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ALLOW_RESTRICTED_ACCOUNT_KEY } from '../decorators/allow-restricted-account.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    @InjectModel('User') private users: Model<any>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Authentication required');
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const user = await this.users
      .findById(payload.sub)
      .select('role accountStatus');
    if (!user) throw new UnauthorizedException('Invalid token');
    const allowRestricted = this.reflector.getAllAndOverride<boolean>(
      ALLOW_RESTRICTED_ACCOUNT_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (user.accountStatus !== 'active' && !allowRestricted)
      throw new ForbiddenException('Account is not active');
    req.user = { id: user.id, role: user.role }; // role is read from the DB, never trusted from the token
    return true;
  }
}
