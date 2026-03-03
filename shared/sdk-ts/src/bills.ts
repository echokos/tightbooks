import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const BILLS_ROUTES = {
  LIST: '/api/bills',
  BY_ID: '/api/bills/{id}',
  PAYMENT_TRANSACTIONS: '/api/bills/{id}/payment-transactions',
  OPEN: '/api/bills/{id}/open',
  DUE: '/api/bills/due',
  VALIDATE_BULK_DELETE: '/api/bills/validate-bulk-delete',
  BULK_DELETE: '/api/bills/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetBills = paths[typeof BILLS_ROUTES.LIST]['get'];
type GetBill = paths[typeof BILLS_ROUTES.BY_ID]['get'];
type CreateBill = paths[typeof BILLS_ROUTES.LIST]['post'];
type EditBill = paths[typeof BILLS_ROUTES.BY_ID]['put'];
type DeleteBill = paths[typeof BILLS_ROUTES.BY_ID]['delete'];

export type BillsListResponse = GetBills['responses'][200]['content']['application/json'];
export type Bill = GetBill['responses'][200]['content']['application/json'];
export type CreateBillBody = CreateBill['requestBody']['content']['application/json'];
export type EditBillBody = EditBill['requestBody']['content']['application/json'];

export async function fetchBills(fetcher: ApiFetcher): Promise<BillsListResponse> {
  const get = fetcher.path(BILLS_ROUTES.LIST).method('get').create();
  // Schema incorrectly marks path.id on list endpoint; route has no {id}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (get as (params?: any) => Promise<{ data: BillsListResponse }>)({});
  return data;
}

export async function fetchBill(fetcher: ApiFetcher, id: number): Promise<Bill> {
  const get = fetcher.path(BILLS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createBill(
  fetcher: ApiFetcher,
  values: CreateBillBody
): Promise<void> {
  const post = fetcher.path(BILLS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editBill(
  fetcher: ApiFetcher,
  id: number,
  values: EditBillBody
): Promise<void> {
  const put = fetcher.path(BILLS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteBill(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(BILLS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
