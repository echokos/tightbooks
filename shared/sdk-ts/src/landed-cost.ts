import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const LANDED_COST_ROUTES = {
  TRANSACTIONS: '/api/landed-cost/transactions',
  ALLOCATE: '/api/landed-cost/bills/{billId}/allocate',
  BY_ID: '/api/landed-cost/{allocatedLandedCostId}',
  BILL_TRANSACTIONS: '/api/landed-cost/bills/{billId}/transactions',
} as const satisfies Record<string, keyof paths>;

type GetLandedCostTransactions = paths[typeof LANDED_COST_ROUTES.TRANSACTIONS]['get'];

type GetLandedCostTransactions200 = GetLandedCostTransactions['responses'][200];
export type LandedCostTransactionsResponse = GetLandedCostTransactions200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchLandedCostTransactions(fetcher: ApiFetcher): Promise<LandedCostTransactionsResponse> {
  const get = fetcher.path(LANDED_COST_ROUTES.TRANSACTIONS).method('get').create();
  const { data } = await get({});
  return data;
}
