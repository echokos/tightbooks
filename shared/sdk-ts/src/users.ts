import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const USERS_ROUTES = {
  LIST: '/api/users',
  BY_ID: '/api/users/{id}',
  ACTIVATE: '/api/users/{id}/activate',
  INACTIVATE: '/api/users/{id}/inactivate',
} as const satisfies Record<string, keyof paths>;

type GetUsers = paths[typeof USERS_ROUTES.LIST]['get'];
type GetUser = paths[typeof USERS_ROUTES.BY_ID]['get'];
type EditUser = paths[typeof USERS_ROUTES.BY_ID]['put'];

type GetUsers200 = GetUsers['responses'][200];
type GetUser200 = GetUser['responses'][200];
export type UsersListResponse = GetUsers200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type User = GetUser200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type EditUserBody = EditUser['requestBody']['content']['application/json'];

export type GetUsersQuery = GetUsers['parameters']['query'];

export async function fetchUsers(
  fetcher: ApiFetcher,
  query: GetUsersQuery = { page: 1, page_size: 20 }
): Promise<UsersListResponse> {
  const get = fetcher.path(USERS_ROUTES.LIST).method('get').create();
  const { data } = await get(query);
  return data;
}

export async function fetchUser(fetcher: ApiFetcher, id: number): Promise<User> {
  const get = fetcher.path(USERS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function editUser(
  fetcher: ApiFetcher,
  id: number,
  values: EditUserBody
): Promise<void> {
  const put = fetcher.path(USERS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteUser(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(USERS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function activateUser(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(USERS_ROUTES.ACTIVATE).method('put').create();
  await (put as (params: { id: number }) => ReturnType<typeof put>)({ id });
}

export async function inactivateUser(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(USERS_ROUTES.INACTIVATE).method('put').create();
  await (put as (params: { id: number }) => ReturnType<typeof put>)({ id });
}
