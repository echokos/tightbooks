import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const SALE_ESTIMATES_ROUTES = {
  LIST: '/api/sale-estimates',
  BY_ID: '/api/sale-estimates/{id}',
  STATE: '/api/sale-estimates/state',
  VALIDATE_BULK_DELETE: '/api/sale-estimates/validate-bulk-delete',
  BULK_DELETE: '/api/sale-estimates/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetSaleEstimates = paths[typeof SALE_ESTIMATES_ROUTES.LIST]['get'];
type GetSaleEstimate = paths[typeof SALE_ESTIMATES_ROUTES.BY_ID]['get'];
type CreateSaleEstimate = paths[typeof SALE_ESTIMATES_ROUTES.LIST]['post'];
type EditSaleEstimate = paths[typeof SALE_ESTIMATES_ROUTES.BY_ID]['put'];
type DeleteSaleEstimate = paths[typeof SALE_ESTIMATES_ROUTES.BY_ID]['delete'];

type GetSaleEstimates200 = GetSaleEstimates['responses'][200];
type GetSaleEstimate200 = GetSaleEstimate['responses'][200];
export type SaleEstimatesListResponse = GetSaleEstimates200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type SaleEstimate = GetSaleEstimate200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateSaleEstimateBody = CreateSaleEstimate['requestBody']['content']['application/json'];
export type EditSaleEstimateBody = EditSaleEstimate['requestBody']['content']['application/json'];

export async function fetchSaleEstimates(fetcher: ApiFetcher): Promise<SaleEstimatesListResponse> {
  const get = fetcher.path(SALE_ESTIMATES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchSaleEstimate(fetcher: ApiFetcher, id: number): Promise<SaleEstimate> {
  const get = fetcher.path(SALE_ESTIMATES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createSaleEstimate(
  fetcher: ApiFetcher,
  values: CreateSaleEstimateBody
): Promise<void> {
  const post = fetcher.path(SALE_ESTIMATES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editSaleEstimate(
  fetcher: ApiFetcher,
  id: number,
  values: EditSaleEstimateBody
): Promise<void> {
  const put = fetcher.path(SALE_ESTIMATES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteSaleEstimate(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(SALE_ESTIMATES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
