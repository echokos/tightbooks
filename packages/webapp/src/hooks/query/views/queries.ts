import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { ResourceViewResponse, ResourceMetaResponse } from '@bigcapital/sdk-ts';
import { fetchResourceView, fetchResourceMeta } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { viewsKeys } from './query-keys';

export function useResourceViews(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceViewResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: viewsKeys.view(resourceSlug),
    queryFn: () => fetchResourceView(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
  });
}

export function useResourceMeta(
  resourceSlug: string | null | undefined,
  props?: Omit<UseQueryOptions<ResourceMetaResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: viewsKeys.meta(resourceSlug),
    queryFn: () => fetchResourceMeta(fetcher, resourceSlug!),
    enabled: !!resourceSlug,
  });
}
