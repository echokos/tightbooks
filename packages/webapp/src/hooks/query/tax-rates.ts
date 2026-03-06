import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  TaxRatesListResponse,
  TaxRate,
  CreateTaxRateBody,
  EditTaxRateBody,
} from '@bigcapital/sdk-ts';
import {
  fetchTaxRates,
  fetchTaxRate,
  createTaxRate,
  editTaxRate,
  deleteTaxRate,
  activateTaxRate,
  inactivateTaxRate,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import QUERY_TYPES from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.TAX_RATES] });
};

export function useTaxRates(
  props?: Omit<UseQueryOptions<TaxRatesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [QUERY_TYPES.TAX_RATES],
    queryFn: () => fetchTaxRates(fetcher),
    select: (data) => ((data as { data?: unknown })?.data ?? data) as unknown[],
    ...props,
  });
}

export function useTaxRate(
  taxRateId: number | null | undefined,
  props?: Omit<UseQueryOptions<TaxRate>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [QUERY_TYPES.TAX_RATES, taxRateId],
    queryFn: () => fetchTaxRate(fetcher, taxRateId!),
    enabled: !!taxRateId,
    ...props,
  });
}

export function useEditTaxRate(
  props?: UseMutationOptions<void, Error, [string, EditTaxRateBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: ([id, values]: [string, EditTaxRateBody]) =>
      editTaxRate(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.TAX_RATES, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.ITEM] });
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.ITEMS] });
    },
    ...props,
  });
}

export function useCreateTaxRate(
  props?: UseMutationOptions<void, Error, CreateTaxRateBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (values: CreateTaxRateBody) => createTaxRate(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useDeleteTaxRate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (id: number) => deleteTaxRate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.TAX_RATES, id] });
    },
    ...props,
  });
}

export function useActivateTaxRate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (id: number) => activateTaxRate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.TAX_RATES, id] });
    },
    ...props,
  });
}

export function useInactivateTaxRate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (id: number) => inactivateTaxRate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [QUERY_TYPES.TAX_RATES, id] });
    },
    ...props,
  });
}
