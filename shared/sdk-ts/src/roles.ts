import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ROLES_ROUTES = {
  LIST: '/api/roles',
  BY_ID: '/api/roles/{id}',
  PERMISSIONS_SCHEMA: '/api/roles/permissions/schema',
} as const satisfies Record<string, keyof paths>;

type GetRoles = paths[typeof ROLES_ROUTES.LIST]['get'];
type GetRole = paths[typeof ROLES_ROUTES.BY_ID]['get'];
type CreateRole = paths[typeof ROLES_ROUTES.LIST]['post'];
type EditRole = paths[typeof ROLES_ROUTES.BY_ID]['put'];
type DeleteRole = paths[typeof ROLES_ROUTES.BY_ID]['delete'];
type GetPermissionsSchema = paths[typeof ROLES_ROUTES.PERMISSIONS_SCHEMA]['get'];

type GetRoles200 = GetRoles['responses'][200];
type GetRole200 = GetRole['responses'][200];
type GetPermissionsSchema200 = GetPermissionsSchema['responses'][200];
export type RolesListResponse = GetRoles200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type Role = GetRole200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateRoleBody = CreateRole['requestBody']['content']['application/json'];
export type EditRoleBody = EditRole['requestBody']['content']['application/json'];
export type RolePermissionsSchema = GetPermissionsSchema200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchRoles(fetcher: ApiFetcher): Promise<RolesListResponse> {
  const get = fetcher.path(ROLES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchRole(fetcher: ApiFetcher, id: number): Promise<Role> {
  const get = fetcher.path(ROLES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createRole(
  fetcher: ApiFetcher,
  values: CreateRoleBody
): Promise<void> {
  const post = fetcher.path(ROLES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editRole(
  fetcher: ApiFetcher,
  id: number,
  values: EditRoleBody
): Promise<void> {
  const put = fetcher.path(ROLES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteRole(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(ROLES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function fetchRolePermissionsSchema(fetcher: ApiFetcher): Promise<RolePermissionsSchema> {
  const get = fetcher.path(ROLES_ROUTES.PERMISSIONS_SCHEMA).method('get').create();
  const { data } = await get({});
  return data;
}
