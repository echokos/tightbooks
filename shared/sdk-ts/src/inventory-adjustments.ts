import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const INVENTORY_ADJUSTMENTS_ROUTES = {
  LIST: '/api/inventory-adjustments',
  BY_ID: '/api/inventory-adjustments/{id}',
  QUICK: '/api/inventory-adjustments/quick',
  PUBLISH: '/api/inventory-adjustments/{id}/publish',
} as const satisfies Record<string, keyof paths>;

type GetInventoryAdjustments = paths[typeof INVENTORY_ADJUSTMENTS_ROUTES.LIST]['get'];
type GetInventoryAdjustment = paths[typeof INVENTORY_ADJUSTMENTS_ROUTES.BY_ID]['get'];
type CreateQuick = paths[typeof INVENTORY_ADJUSTMENTS_ROUTES.QUICK]['post'];
type DeleteInventoryAdjustment = paths[typeof INVENTORY_ADJUSTMENTS_ROUTES.BY_ID]['delete'];

type GetInventoryAdjustments200 = GetInventoryAdjustments['responses'][200];
type GetInventoryAdjustment200 = GetInventoryAdjustment['responses'][200];
export type InventoryAdjustmentsListResponse = GetInventoryAdjustments200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type InventoryAdjustment = GetInventoryAdjustment200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateQuickInventoryAdjustmentBody = CreateQuick['requestBody']['content']['application/json'];

export async function fetchInventoryAdjustments(fetcher: ApiFetcher): Promise<InventoryAdjustmentsListResponse> {
  const get = fetcher.path(INVENTORY_ADJUSTMENTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchInventoryAdjustment(fetcher: ApiFetcher, id: number): Promise<InventoryAdjustment> {
  const get = fetcher.path(INVENTORY_ADJUSTMENTS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createQuickInventoryAdjustment(
  fetcher: ApiFetcher,
  values: CreateQuickInventoryAdjustmentBody
): Promise<void> {
  const post = fetcher.path(INVENTORY_ADJUSTMENTS_ROUTES.QUICK).method('post').create();
  await post(values);
}

export async function deleteInventoryAdjustment(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(INVENTORY_ADJUSTMENTS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function publishInventoryAdjustment(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(INVENTORY_ADJUSTMENTS_ROUTES.PUBLISH).method('put').create();
  await put({ id });
}
