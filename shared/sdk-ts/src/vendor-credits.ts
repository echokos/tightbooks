import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpRequestBody, OpResponseBody } from './utils';

export const VENDOR_CREDITS_ROUTES = {
  LIST: '/api/vendor-credits',
  BY_ID: '/api/vendor-credits/{id}',
  OPEN: '/api/vendor-credits/{id}/open',
  VALIDATE_BULK_DELETE: '/api/vendor-credits/validate-bulk-delete',
  BULK_DELETE: '/api/vendor-credits/bulk-delete',
} as const satisfies Record<string, keyof paths>;

export type VendorCreditsListResponse = OpResponseBody<OpForPath<typeof VENDOR_CREDITS_ROUTES.LIST, 'get'>>;
export type VendorCredit = OpResponseBody<OpForPath<typeof VENDOR_CREDITS_ROUTES.BY_ID, 'get'>>;
export type CreateVendorCreditBody = OpRequestBody<OpForPath<typeof VENDOR_CREDITS_ROUTES.LIST, 'post'>>;
export type EditVendorCreditBody = OpRequestBody<OpForPath<typeof VENDOR_CREDITS_ROUTES.BY_ID, 'put'>>;

export async function fetchVendorCredits(fetcher: ApiFetcher): Promise<VendorCreditsListResponse> {
  const get = fetcher.path(VENDOR_CREDITS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchVendorCredit(fetcher: ApiFetcher, id: number): Promise<VendorCredit> {
  const get = fetcher.path(VENDOR_CREDITS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createVendorCredit(
  fetcher: ApiFetcher,
  values: CreateVendorCreditBody
): Promise<void> {
  const post = fetcher.path(VENDOR_CREDITS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editVendorCredit(
  fetcher: ApiFetcher,
  id: number,
  values: EditVendorCreditBody
): Promise<void> {
  const put = fetcher.path(VENDOR_CREDITS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteVendorCredit(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(VENDOR_CREDITS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function openVendorCredit(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(VENDOR_CREDITS_ROUTES.OPEN).method('put').create();
  await put({ id });
}
