import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type { ApiKeysList, GenerateApiKeyBody } from '@bigcapital/sdk-ts';
import { fetchApiKeys, generateApiKey, revokeApiKey } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.API_KEYS] });
};

export function useApiKeys(
  props?: Omit<UseQueryOptions<ApiKeysList>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.API_KEYS],
    queryFn: () => fetchApiKeys(fetcher),
    ...props,
  });
}

export function useGenerateApiKey(
  props?: UseMutationOptions<void, Error, GenerateApiKeyBody>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: GenerateApiKeyBody) => generateApiKey(fetcher, values),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useRevokeApiKey(
  props?: UseMutationOptions<void, Error, number>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => revokeApiKey(fetcher, id),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}
