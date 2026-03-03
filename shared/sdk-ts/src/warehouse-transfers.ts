import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const WAREHOUSE_TRANSFERS_ROUTES = {
  LIST: '/api/warehouse-transfers',
  BY_ID: '/api/warehouse-transfers/{id}',
  INITIATE: '/api/warehouse-transfers/{id}/initiate',
  TRANSFERRED: '/api/warehouse-transfers/{id}/transferred',
} as const satisfies Record<string, keyof paths>;

type GetWarehouseTransfers = paths[typeof WAREHOUSE_TRANSFERS_ROUTES.LIST]['get'];
type GetWarehouseTransfer = paths[typeof WAREHOUSE_TRANSFERS_ROUTES.BY_ID]['get'];
type CreateWarehouseTransfer = paths[typeof WAREHOUSE_TRANSFERS_ROUTES.LIST]['post'];
type EditWarehouseTransfer = paths[typeof WAREHOUSE_TRANSFERS_ROUTES.BY_ID]['put'];
type DeleteWarehouseTransfer = paths[typeof WAREHOUSE_TRANSFERS_ROUTES.BY_ID]['delete'];

type GetWarehouseTransfers200 = GetWarehouseTransfers['responses'][200];
type GetWarehouseTransfer200 = GetWarehouseTransfer['responses'][200];
export type WarehouseTransfersListResponse = GetWarehouseTransfers200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type WarehouseTransfer = GetWarehouseTransfer200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateBody = CreateWarehouseTransfer extends { requestBody: { content: { 'application/json': infer J } } } ? J : Record<string, unknown>;
type EditBody = EditWarehouseTransfer extends { requestBody: { content: { 'application/json': infer J } } } ? J : Record<string, unknown>;
export type CreateWarehouseTransferBody = CreateBody;
export type EditWarehouseTransferBody = EditBody;

export async function fetchWarehouseTransfers(fetcher: ApiFetcher): Promise<WarehouseTransfersListResponse> {
  const get = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchWarehouseTransfer(fetcher: ApiFetcher, id: number): Promise<WarehouseTransfer> {
  const get = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createWarehouseTransfer(
  fetcher: ApiFetcher,
  values: CreateWarehouseTransferBody
): Promise<void> {
  const post = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
  values: EditWarehouseTransferBody
): Promise<void> {
  const put = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID).method('put').create();
  await (put as unknown as (params: { id: number } & EditWarehouseTransferBody) => Promise<void>)({ id, ...values });
}

export async function deleteWarehouseTransfer(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID).method('delete').create();
  await (del as unknown as (params: { id: number }) => Promise<void>)({ id });
}

export async function initiateWarehouseTransfer(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.INITIATE).method('put').create();
  await (put as unknown as (params: { id: number }) => Promise<void>)({ id });
}

export async function transferredWarehouseTransfer(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(WAREHOUSE_TRANSFERS_ROUTES.TRANSFERRED).method('put').create();
  await (put as unknown as (params: { id: number }) => Promise<void>)({ id });
}
