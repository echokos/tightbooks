import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const SALE_RECEIPTS_ROUTES = {
  LIST: '/api/sale-receipts',
  BY_ID: '/api/sale-receipts/{id}',
  STATE: '/api/sale-receipts/state',
  VALIDATE_BULK_DELETE: '/api/sale-receipts/validate-bulk-delete',
  BULK_DELETE: '/api/sale-receipts/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetSaleReceipts = paths[typeof SALE_RECEIPTS_ROUTES.LIST]['get'];
type GetSaleReceipt = paths[typeof SALE_RECEIPTS_ROUTES.BY_ID]['get'];
type CreateSaleReceipt = paths[typeof SALE_RECEIPTS_ROUTES.LIST]['post'];
type EditSaleReceipt = paths[typeof SALE_RECEIPTS_ROUTES.BY_ID]['put'];
type DeleteSaleReceipt = paths[typeof SALE_RECEIPTS_ROUTES.BY_ID]['delete'];

type GetSaleReceipts200 = GetSaleReceipts['responses'][200];
type GetSaleReceipt200 = GetSaleReceipt['responses'][200];
export type SaleReceiptsListResponse = GetSaleReceipts200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type SaleReceipt = GetSaleReceipt200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateSaleReceiptBody = CreateSaleReceipt['requestBody']['content']['application/json'];
export type EditSaleReceiptBody = EditSaleReceipt['requestBody']['content']['application/json'];

export async function fetchSaleReceipts(fetcher: ApiFetcher): Promise<SaleReceiptsListResponse> {
  const get = fetcher.path(SALE_RECEIPTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchSaleReceipt(fetcher: ApiFetcher, id: number): Promise<SaleReceipt> {
  const get = fetcher.path(SALE_RECEIPTS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createSaleReceipt(
  fetcher: ApiFetcher,
  values: CreateSaleReceiptBody
): Promise<void> {
  const post = fetcher.path(SALE_RECEIPTS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editSaleReceipt(
  fetcher: ApiFetcher,
  id: number,
  values: EditSaleReceiptBody
): Promise<void> {
  const put = fetcher.path(SALE_RECEIPTS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteSaleReceipt(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(SALE_RECEIPTS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
