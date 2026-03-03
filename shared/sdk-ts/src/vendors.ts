import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const VENDORS_ROUTES = {
  LIST: '/api/vendors',
  BY_ID: '/api/vendors/{id}',
  OPENING_BALANCE: '/api/vendors/{id}/opening-balance',
  VALIDATE_BULK_DELETE: '/api/vendors/validate-bulk-delete',
  BULK_DELETE: '/api/vendors/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetVendors = paths[typeof VENDORS_ROUTES.LIST]['get'];
type GetVendor = paths[typeof VENDORS_ROUTES.BY_ID]['get'];
type CreateVendor = paths[typeof VENDORS_ROUTES.LIST]['post'];
type EditVendor = paths[typeof VENDORS_ROUTES.BY_ID]['put'];
type ValidateBulkDelete = paths[typeof VENDORS_ROUTES.VALIDATE_BULK_DELETE]['post'];
type BulkDelete = paths[typeof VENDORS_ROUTES.BULK_DELETE]['post'];

type GetVendors200 = GetVendors['responses'][200];
type GetVendor200 = GetVendor['responses'][200];
export type VendorsListResponse = GetVendors200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type Vendor = GetVendor200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateVendorBody = CreateVendor['requestBody']['content']['application/json'];
export type EditVendorBody = EditVendor['requestBody']['content']['application/json'];
export type ValidateBulkDeleteVendorsResponse = ValidateBulkDelete['responses'][200]['content']['application/json'];
export type BulkDeleteVendorsBody = BulkDelete['requestBody']['content']['application/json'];

export async function fetchVendors(fetcher: ApiFetcher): Promise<VendorsListResponse> {
  const get = fetcher.path(VENDORS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchVendor(fetcher: ApiFetcher, id: number): Promise<Vendor> {
  const get = fetcher.path(VENDORS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createVendor(
  fetcher: ApiFetcher,
  values: CreateVendorBody
): Promise<void> {
  const post = fetcher.path(VENDORS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editVendor(
  fetcher: ApiFetcher,
  id: number,
  values: EditVendorBody
): Promise<void> {
  const put = fetcher.path(VENDORS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteVendor(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(VENDORS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function validateBulkDeleteVendors(
  fetcher: ApiFetcher,
  body: BulkDeleteVendorsBody
): Promise<ValidateBulkDeleteVendorsResponse> {
  const validate = fetcher.path(VENDORS_ROUTES.VALIDATE_BULK_DELETE).method('post').create();
  const { data } = await validate(body);
  return data;
}

export async function bulkDeleteVendors(
  fetcher: ApiFetcher,
  body: BulkDeleteVendorsBody
): Promise<void> {
  const post = fetcher.path(VENDORS_ROUTES.BULK_DELETE).method('post').create();
  await post(body);
}
