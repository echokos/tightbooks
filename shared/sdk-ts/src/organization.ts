import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ORGANIZATION_ROUTES = {
  CURRENT: '/api/organization/current',
  BUILD: '/api/organization/build',
  BUILD_JOB: '/api/organization/build/{buildJobId}',
  BASE_CURRENCY_MUTATE: '/api/organization/base-currency-mutate',
  UPDATE: '/api/organization',
} as const satisfies Record<string, keyof paths>;

type GetCurrent = paths[typeof ORGANIZATION_ROUTES.CURRENT]['get'];
type UpdateOrganization = paths[typeof ORGANIZATION_ROUTES.UPDATE]['put'];

type GetCurrent200 = GetCurrent['responses'][200];
export type OrganizationCurrent = GetCurrent200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type UpdateOrganizationBody = UpdateOrganization['requestBody']['content']['application/json'];

export async function fetchOrganizationCurrent(fetcher: ApiFetcher): Promise<OrganizationCurrent> {
  const get = fetcher.path(ORGANIZATION_ROUTES.CURRENT).method('get').create();
  const { data } = await get({});
  return data;
}

export async function updateOrganization(
  fetcher: ApiFetcher,
  values: UpdateOrganizationBody
): Promise<void> {
  const put = fetcher.path(ORGANIZATION_ROUTES.UPDATE).method('put').create();
  await put(values);
}

export type Organization = OrganizationCurrent;
export async function fetchOrganization(fetcher: ApiFetcher): Promise<Organization> {
  return fetchOrganizationCurrent(fetcher);
}
