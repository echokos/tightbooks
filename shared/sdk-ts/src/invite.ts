import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const INVITE_ROUTES = {
  INVITE: '/api/invite',
  RESEND: '/api/invite/users/{id}/resend',
  ACCEPT: '/api/invite/accept/{token}',
  CHECK: '/api/invite/check/{token}',
} as const satisfies Record<string, keyof paths>;

type InviteUser = paths[typeof INVITE_ROUTES.INVITE]['patch'];
type ResendInvite = paths[typeof INVITE_ROUTES.RESEND]['post'];

export type InviteUserBody = InviteUser['requestBody']['content']['application/json'];

export async function inviteUser(
  fetcher: ApiFetcher,
  values: InviteUserBody
): Promise<void> {
  const patch = fetcher.path(INVITE_ROUTES.INVITE).method('patch').create();
  await patch(values);
}

export async function resendInvite(fetcher: ApiFetcher, id: number): Promise<void> {
  const post = fetcher.path(INVITE_ROUTES.RESEND).method('post').create();
  await post({ id });
}
