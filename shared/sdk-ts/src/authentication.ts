import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const AUTH_ROUTES = {
  ACCOUNT: '/api/auth/account',
  RESEND_SIGNUP: '/api/auth/signup/verify/resend',
} as const satisfies Record<string, keyof paths>;

type GetAuthedAccount = paths[typeof AUTH_ROUTES.ACCOUNT]['get'];

type GetAuthedAccount200 = GetAuthedAccount['responses'][200];
export type AuthedAccount = GetAuthedAccount200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchAuthedAccount(fetcher: ApiFetcher): Promise<AuthedAccount> {
  const get = fetcher.path(AUTH_ROUTES.ACCOUNT).method('get').create();
  const { data } = await get({});
  return data;
}
