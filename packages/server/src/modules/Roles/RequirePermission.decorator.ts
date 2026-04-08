import { SetMetadata } from '@nestjs/common';
import { AbilitySubject } from './Roles.types';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  ability: string;
  subject: AbilitySubject | string;
}

export const RequirePermission = (
  ability: string,
  subject: AbilitySubject | string,
) => SetMetadata(REQUIRED_PERMISSION_KEY, { ability, subject });
