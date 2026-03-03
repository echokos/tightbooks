import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const BANKING_ACCOUNTS_ROUTES = {
  LIST: '/api/banking/accounts',
  SUMMARY: '/api/banking/accounts/{bankAccountId}/summary',
} as const satisfies Record<string, keyof paths>;

type GetBankingAccounts = paths[typeof BANKING_ACCOUNTS_ROUTES.LIST]['get'];

type GetBankingAccounts200 = GetBankingAccounts['responses'][200];
export type BankingAccountsListResponse = GetBankingAccounts200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchBankingAccounts(fetcher: ApiFetcher): Promise<BankingAccountsListResponse> {
  const get = fetcher.path(BANKING_ACCOUNTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchBankingAccountSummary(
  fetcher: ApiFetcher,
  bankAccountId: number
): Promise<void> {
  const get = fetcher.path(BANKING_ACCOUNTS_ROUTES.SUMMARY).method('get').create();
  await get({ bankAccountId });
}
