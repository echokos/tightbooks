import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const SALE_INVOICES_ROUTES = {
  LIST: '/api/sale-invoices',
  BY_ID: '/api/sale-invoices/{id}',
  STATE: '/api/sale-invoices/state',
  RECEIVABLE: '/api/sale-invoices/receivable',
  MAIL: '/api/sale-invoices/{id}/mail',
  DELIVER: '/api/sale-invoices/{id}/deliver',
  WRITEOFF: '/api/sale-invoices/{id}/writeoff',
  CANCEL_WRITEOFF: '/api/sale-invoices/{id}/cancel-writeoff',
  PAYMENTS: '/api/sale-invoices/{id}/payments',
  HTML: '/api/sale-invoices/{id}/html',
  GENERATE_LINK: '/api/sale-invoices/{id}/generate-link',
  VALIDATE_BULK_DELETE: '/api/sale-invoices/validate-bulk-delete',
  BULK_DELETE: '/api/sale-invoices/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetSaleInvoices = paths[typeof SALE_INVOICES_ROUTES.LIST]['get'];
type GetSaleInvoice = paths[typeof SALE_INVOICES_ROUTES.BY_ID]['get'];
type CreateSaleInvoice = paths[typeof SALE_INVOICES_ROUTES.LIST]['post'];
type EditSaleInvoice = paths[typeof SALE_INVOICES_ROUTES.BY_ID]['put'];
type DeleteSaleInvoice = paths[typeof SALE_INVOICES_ROUTES.BY_ID]['delete'];

export type SaleInvoicesListResponse = GetSaleInvoices['responses'][200]['content']['application/json'];
export type SaleInvoice = GetSaleInvoice['responses'][200]['content']['application/json'];
export type CreateSaleInvoiceBody = CreateSaleInvoice['requestBody']['content']['application/json'];
export type EditSaleInvoiceBody = EditSaleInvoice['requestBody']['content']['application/json'];

export async function fetchSaleInvoices(fetcher: ApiFetcher): Promise<SaleInvoicesListResponse> {
  const get = fetcher.path(SALE_INVOICES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchSaleInvoice(fetcher: ApiFetcher, id: number): Promise<SaleInvoice> {
  const get = fetcher.path(SALE_INVOICES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createSaleInvoice(
  fetcher: ApiFetcher,
  values: CreateSaleInvoiceBody
): Promise<void> {
  const post = fetcher.path(SALE_INVOICES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editSaleInvoice(
  fetcher: ApiFetcher,
  id: number,
  values: EditSaleInvoiceBody
): Promise<void> {
  const put = fetcher.path(SALE_INVOICES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteSaleInvoice(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(SALE_INVOICES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
