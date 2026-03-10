import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { ResourceViewResponse, ResourceMetaResponse } from '@bigcapital/sdk-ts';
import { fetchResourceView, fetchResourceMeta } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

export function useResourceViews(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceViewResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: ['RESOURCE_VIEW', resourceSlug],
    queryFn: () => fetchResourceView(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
    ...props,
  });
}

export function useResourceMeta(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceMetaResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: ['RESOURCE_META', resourceSlug],
    queryFn: () => fetchResourceMeta(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
    ...props,
  });
}
