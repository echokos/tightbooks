import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const VIEWS_ROUTES = {
  RESOURCE: '/api/views/resource/{resourceModel}',
} as const satisfies Record<string, keyof paths>;

type GetResourceView = paths[typeof VIEWS_ROUTES.RESOURCE]['get'];

type GetResourceView200 = GetResourceView['responses'][200];
export type ResourceViewResponse = GetResourceView200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchResourceView(
  fetcher: ApiFetcher,
  resourceModel: string
): Promise<ResourceViewResponse> {
  const get = fetcher.path(VIEWS_ROUTES.RESOURCE).method('get').create();
  const { data } = await get({ resourceModel });
  return data;
}
