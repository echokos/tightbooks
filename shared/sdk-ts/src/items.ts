import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ITEMS_ROUTES = {
  LIST: '/api/items',
  BY_ID: '/api/items/{id}',
  VALIDATE_BULK_DELETE: '/api/items/validate-bulk-delete',
  BULK_DELETE: '/api/items/bulk-delete',
  INACTIVATE: '/api/items/{id}/inactivate',
  ACTIVATE: '/api/items/{id}/activate',
  INVOICES: '/api/items/{id}/invoices',
  BILLS: '/api/items/{id}/bills',
  ESTIMATES: '/api/items/{id}/estimates',
  RECEIPTS: '/api/items/{id}/receipts',
  WAREHOUSES: '/api/items/{id}/warehouses',
} as const satisfies Record<string, keyof paths>;

type GetItems = paths[typeof ITEMS_ROUTES.LIST]['get'];
type GetItem = paths[typeof ITEMS_ROUTES.BY_ID]['get'];
type CreateItem = paths[typeof ITEMS_ROUTES.LIST]['post'];
type EditItem = paths[typeof ITEMS_ROUTES.BY_ID]['put'];
type DeleteItem = paths[typeof ITEMS_ROUTES.BY_ID]['delete'];
type BulkDelete = paths[typeof ITEMS_ROUTES.BULK_DELETE]['post'];
type ValidateBulkDelete = paths[typeof ITEMS_ROUTES.VALIDATE_BULK_DELETE]['post'];

export type ItemsListResponse = GetItems['responses'][200]['content']['application/json'];
export type Item = GetItem['responses'][200]['content']['application/json'];
export type CreateItemBody = CreateItem['requestBody']['content']['application/json'];
export type EditItemBody = EditItem['requestBody']['content']['application/json'];
export type BulkDeleteItemsBody = BulkDelete['requestBody']['content']['application/json'];
export type ValidateBulkDeleteItemsResponse = ValidateBulkDelete['responses'][200]['content']['application/json'];

export async function fetchItems(fetcher: ApiFetcher): Promise<ItemsListResponse> {
  const get = fetcher.path(ITEMS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchItem(fetcher: ApiFetcher, id: number): Promise<Item> {
  const get = fetcher.path(ITEMS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createItem(
  fetcher: ApiFetcher,
  values: CreateItemBody
): Promise<void> {
  const post = fetcher.path(ITEMS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editItem(
  fetcher: ApiFetcher,
  id: number,
  values: EditItemBody
): Promise<void> {
  const put = fetcher.path(ITEMS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteItem(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(ITEMS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function inactivateItem(fetcher: ApiFetcher, id: number): Promise<void> {
  const patch = fetcher.path(ITEMS_ROUTES.INACTIVATE).method('patch').create();
  await patch({ id });
}

export async function activateItem(fetcher: ApiFetcher, id: number): Promise<void> {
  const patch = fetcher.path(ITEMS_ROUTES.ACTIVATE).method('patch').create();
  await patch({ id });
}

export async function validateBulkDeleteItems(
  fetcher: ApiFetcher,
  body: BulkDeleteItemsBody
): Promise<ValidateBulkDeleteItemsResponse> {
  const validate = fetcher.path(ITEMS_ROUTES.VALIDATE_BULK_DELETE).method('post').create();
  const { data } = await validate(body);
  return data;
}

export async function bulkDeleteItems(
  fetcher: ApiFetcher,
  body: BulkDeleteItemsBody
): Promise<void> {
  const post = fetcher.path(ITEMS_ROUTES.BULK_DELETE).method('post').create();
  await post(body);
}
