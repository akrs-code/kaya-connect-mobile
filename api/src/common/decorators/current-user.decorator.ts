import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../constants/roles';
export interface AuthUser {
  id: string;
  role: Role;
}
/** @CurrentUser() -> whole user, @CurrentUser('id') -> just the id */
export const CurrentUser = createParamDecorator(
  (key: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user: AuthUser = ctx.switchToHttp().getRequest().user;
    return key ? user?.[key] : user;
  },
);
