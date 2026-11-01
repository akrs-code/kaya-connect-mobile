import { SetMetadata } from '@nestjs/common';

export const ALLOW_RESTRICTED_ACCOUNT_KEY = 'allowRestrictedAccount';
export const AllowRestrictedAccount = () =>
  SetMetadata(ALLOW_RESTRICTED_ACCOUNT_KEY, true);
