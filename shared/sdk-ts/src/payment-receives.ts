import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const PAYMENTS_RECEIVED_ROUTES = {
  LIST: '/api/payments-received',
  BY_ID: '/api/payments-received/{id}',
  STATE: '/api/payments-received/state',
  VALIDATE_BULK_DELETE: '/api/payments-received/validate-bulk-delete',
  BULK_DELETE: '/api/payments-received/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetPaymentsReceived = paths[typeof PAYMENTS_RECEIVED_ROUTES.LIST]['get'];
type GetPaymentReceived = paths[typeof PAYMENTS_RECEIVED_ROUTES.BY_ID]['get'];
type CreatePaymentReceived = paths[typeof PAYMENTS_RECEIVED_ROUTES.LIST]['post'];
type EditPaymentReceived = paths[typeof PAYMENTS_RECEIVED_ROUTES.BY_ID]['put'];
type DeletePaymentReceived = paths[typeof PAYMENTS_RECEIVED_ROUTES.BY_ID]['delete'];

type GetPaymentsReceived200 = GetPaymentsReceived['responses'][200];
type GetPaymentReceived200 = GetPaymentReceived['responses'][200];
export type PaymentsReceivedListResponse = GetPaymentsReceived200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type PaymentReceived = GetPaymentReceived200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreatePaymentReceivedBody = CreatePaymentReceived['requestBody']['content']['application/json'];
export type EditPaymentReceivedBody = EditPaymentReceived['requestBody']['content']['application/json'];

export async function fetchPaymentsReceived(fetcher: ApiFetcher): Promise<PaymentsReceivedListResponse> {
  const get = fetcher.path(PAYMENTS_RECEIVED_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchPaymentReceived(fetcher: ApiFetcher, id: number): Promise<PaymentReceived> {
  const get = fetcher.path(PAYMENTS_RECEIVED_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createPaymentReceived(
  fetcher: ApiFetcher,
  values: CreatePaymentReceivedBody
): Promise<void> {
  const post = fetcher.path(PAYMENTS_RECEIVED_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editPaymentReceived(
  fetcher: ApiFetcher,
  id: number,
  values: EditPaymentReceivedBody
): Promise<void> {
  const put = fetcher.path(PAYMENTS_RECEIVED_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deletePaymentReceived(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(PAYMENTS_RECEIVED_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
