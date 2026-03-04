import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpQueryParams, OpResponseBody } from './utils';

export const LANDED_COST_ROUTES = {
  TRANSACTIONS: '/api/landed-cost/transactions',
  ALLOCATE: '/api/landed-cost/bills/{billId}/allocate',
  BY_ID: '/api/landed-cost/{allocatedLandedCostId}',
  BILL_TRANSACTIONS: '/api/landed-cost/bills/{billId}/transactions',
} as const satisfies Record<string, keyof paths>;

export type LandedCostTransactionsResponse = OpResponseBody<OpForPath<typeof LANDED_COST_ROUTES.TRANSACTIONS, 'get'>>;
export type GetLandedCostTransactionsQuery = OpQueryParams<OpForPath<typeof LANDED_COST_ROUTES.TRANSACTIONS, 'get'>>;

export async function fetchLandedCostTransactions(
  fetcher: ApiFetcher,
  query?: GetLandedCostTransactionsQuery
): Promise<LandedCostTransactionsResponse> {
  const get = fetcher.path(LANDED_COST_ROUTES.TRANSACTIONS).method('get').create();
  const { data } = await (
    get as (params?: GetLandedCostTransactionsQuery) => Promise<{ data: LandedCostTransactionsResponse }>
  )(query ?? {});
  return data;
}
