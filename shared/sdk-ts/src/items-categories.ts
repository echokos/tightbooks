import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ITEMS_CATEGORIES_ROUTES = {
  LIST: '/api/item-categories',
  BY_ID: '/api/item-categories/{id}',
} as const satisfies Record<string, keyof paths>;

type GetItemCategories = paths[typeof ITEMS_CATEGORIES_ROUTES.LIST]['get'];
type GetItemCategory = paths[typeof ITEMS_CATEGORIES_ROUTES.BY_ID]['get'];
type CreateItemCategory = paths[typeof ITEMS_CATEGORIES_ROUTES.LIST]['post'];
type EditItemCategory = paths[typeof ITEMS_CATEGORIES_ROUTES.BY_ID]['put'];
type DeleteItemCategory = paths[typeof ITEMS_CATEGORIES_ROUTES.BY_ID]['delete'];

type GetItemCategories200 = GetItemCategories['responses'][200];
type GetItemCategory200 = GetItemCategory['responses'][200];
export type ItemCategoriesListResponse = GetItemCategories200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type ItemCategory = GetItemCategory200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateItemCategoryBody = CreateItemCategory['requestBody']['content']['application/json'];
export type EditItemCategoryBody = EditItemCategory['requestBody']['content']['application/json'];

export async function fetchItemCategories(fetcher: ApiFetcher): Promise<ItemCategoriesListResponse> {
  const get = fetcher.path(ITEMS_CATEGORIES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchItemCategory(fetcher: ApiFetcher, id: number): Promise<ItemCategory> {
  const get = fetcher.path(ITEMS_CATEGORIES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createItemCategory(
  fetcher: ApiFetcher,
  values: CreateItemCategoryBody
): Promise<void> {
  const post = fetcher.path(ITEMS_CATEGORIES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editItemCategory(
  fetcher: ApiFetcher,
  id: number,
  values: EditItemCategoryBody
): Promise<void> {
  const put = fetcher.path(ITEMS_CATEGORIES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteItemCategory(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(ITEMS_CATEGORIES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
