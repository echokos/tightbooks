import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CurrenciesListResponse,
  CreateCurrencyBody,
  EditCurrencyBody,
} from '@bigcapital/sdk-ts';
import {
  fetchCurrencies,
  createCurrency,
  editCurrency,
  deleteCurrency,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

/**
 * Create a new currency.
 */
export function useCreateCurrency(
  props?: UseMutationOptions<void, Error, CreateCurrencyBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateCurrencyBody) =>
      createCurrency(fetcher, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.CURRENCIES] });
    },
    ...props,
  });
}

/**
 * Edits the given currency by ID.
 */
export function useEditCurrency(
  props?: UseMutationOptions<void, Error, [number, EditCurrencyBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([currencyId, values]: [number, EditCurrencyBody]) =>
      editCurrency(fetcher, currencyId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.CURRENCIES] });
    },
    ...props,
  });
}

/**
 * Deletes the given currency.
 */
export function useDeleteCurrency(
  props?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (currencyCode: string) =>
      deleteCurrency(fetcher, currencyCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.CURRENCIES] });
    },
    ...props,
  });
}

/**
 * Retrieve the currencies list.
 */
export function useCurrencies(
  props?: Omit<UseQueryOptions<CurrenciesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CURRENCIES],
    queryFn: () => fetchCurrencies(fetcher),
    ...props,
  });
}
