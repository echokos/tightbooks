import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const GENERIC_RESOURCE_ROUTES = {
  META: '/api/resources/{resourceModel}/meta',
} as const satisfies Record<string, keyof paths>;

type GetResourceMeta = paths[typeof GENERIC_RESOURCE_ROUTES.META]['get'];

type GetResourceMeta200 = GetResourceMeta['responses'][200];
export type ResourceMetaResponse = GetResourceMeta200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchResourceMeta(
  fetcher: ApiFetcher,
  resourceModel: string
): Promise<ResourceMetaResponse> {
  const get = fetcher.path(GENERIC_RESOURCE_ROUTES.META).method('get').create();
  const { data } = await get({ resourceModel });
  return data;
}
