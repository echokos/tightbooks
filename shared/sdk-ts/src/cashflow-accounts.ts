import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpResponseBody } from './utils';

export const BANKING_ACCOUNTS_ROUTES = {
  LIST: '/api/banking/accounts',
  SUMMARY: '/api/banking/accounts/{bankAccountId}/summary',
} as const satisfies Record<string, keyof paths>;

export type BankingAccountsListResponse = OpResponseBody<OpForPath<typeof BANKING_ACCOUNTS_ROUTES.LIST, 'get'>>;

/** Bank account summary response (schema does not define response body). */
export interface BankingAccountSummaryResponse {
  name: string;
  totalUncategorizedTransactions: number;
  totalRecognizedTransactions: number;
}

export async function fetchBankingAccounts(fetcher: ApiFetcher): Promise<BankingAccountsListResponse> {
  const get = fetcher.path(BANKING_ACCOUNTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchBankingAccountSummary(
  fetcher: ApiFetcher,
  bankAccountId: number
): Promise<BankingAccountSummaryResponse> {
  const get = fetcher.path(BANKING_ACCOUNTS_ROUTES.SUMMARY).method('get').create();
  const { data } = await get({ bankAccountId });
  return data as BankingAccountSummaryResponse;
}
