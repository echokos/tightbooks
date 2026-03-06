import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { ResourceViewResponse, ResourceMetaResponse } from '@bigcapital/sdk-ts';
import { fetchResourceView, fetchResourceMeta } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

/**
 * Retrieve the resource views using sdk-ts.
 */
export function useResourceViews(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceViewResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: ['RESOURCE_VIEW', resourceSlug],
    queryFn: () => fetchResourceView(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
    select: (data) => (Array.isArray(data) ? data : (data as { data?: unknown })?.data ?? data),
    ...props,
  });
}

/**
 * Retrieve the resource meta using sdk-ts.
 */
export function useResourceMeta(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceMetaResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: ['RESOURCE_META', resourceSlug],
    queryFn: () => fetchResourceMeta(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
    select: (data) => (data as { resource_meta?: unknown })?.resource_meta ?? data ?? { fields: {} },
    ...props,
  });
}
