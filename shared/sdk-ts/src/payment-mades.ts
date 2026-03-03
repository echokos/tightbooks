import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const BILL_PAYMENTS_ROUTES = {
  LIST: '/api/bill-payments',
  BY_ID: '/api/bill-payments/{billPaymentId}',
  NEW_PAGE_ENTRIES: '/api/bill-payments/new-page/entries',
  BILLS: '/api/bill-payments/{billPaymentId}/bills',
  EDIT_PAGE: '/api/bill-payments/{billPaymentId}/edit-page',
} as const satisfies Record<string, keyof paths>;

type GetBillPayments = paths[typeof BILL_PAYMENTS_ROUTES.LIST]['get'];
type GetBillPayment = paths[typeof BILL_PAYMENTS_ROUTES.BY_ID]['get'];
type CreateBillPayment = paths[typeof BILL_PAYMENTS_ROUTES.LIST]['post'];
type EditBillPayment = paths[typeof BILL_PAYMENTS_ROUTES.BY_ID]['put'];
type DeleteBillPayment = paths[typeof BILL_PAYMENTS_ROUTES.BY_ID]['delete'];

type GetBillPayments200 = GetBillPayments['responses'][200];
type GetBillPayment200 = GetBillPayment['responses'][200];
export type BillPaymentsListResponse = GetBillPayments200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type BillPayment = GetBillPayment200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateBillPaymentBody = CreateBillPayment['requestBody']['content']['application/json'];
export type EditBillPaymentBody = EditBillPayment['requestBody']['content']['application/json'];

export async function fetchBillPayments(fetcher: ApiFetcher): Promise<BillPaymentsListResponse> {
  const get = fetcher.path(BILL_PAYMENTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchBillPayment(fetcher: ApiFetcher, billPaymentId: number): Promise<BillPayment> {
  const get = fetcher.path(BILL_PAYMENTS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ billPaymentId });
  return data;
}

export async function createBillPayment(
  fetcher: ApiFetcher,
  values: CreateBillPaymentBody
): Promise<void> {
  const post = fetcher.path(BILL_PAYMENTS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editBillPayment(
  fetcher: ApiFetcher,
  billPaymentId: number,
  values: EditBillPaymentBody
): Promise<void> {
  const put = fetcher.path(BILL_PAYMENTS_ROUTES.BY_ID).method('put').create();
  await put({ billPaymentId, ...values });
}

export async function deleteBillPayment(fetcher: ApiFetcher, billPaymentId: number): Promise<void> {
  const del = fetcher.path(BILL_PAYMENTS_ROUTES.BY_ID).method('delete').create();
  await del({ billPaymentId });
}
