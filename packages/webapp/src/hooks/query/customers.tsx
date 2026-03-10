import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Customer,
  CreateCustomerBody,
  EditCustomerBody,
  ValidateBulkDeleteCustomersResponse,
} from '@bigcapital/sdk-ts';
import type { CustomersListResponse } from '@bigcapital/sdk-ts';
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  editCustomer,
  deleteCustomer,
  validateBulkDeleteCustomers,
  bulkDeleteCustomers,
  editCustomerOpeningBalance,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE_SMS_DETAIL] });
  queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE_SMS_DETAIL] });
  queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPT_SMS_DETAIL] });
  queryClient.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVE_SMS_DETAIL] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

export function useCustomers(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<CustomersListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CUSTOMERS, query],
    queryFn: () =>
      (fetchCustomers as (f: ReturnType<typeof useApiFetcher>, q?: Record<string, unknown>) => Promise<CustomersListResponse>)(
        fetcher,
        query
      ),
    ...props,
  });
}

export function useEditCustomer(
  props?: UseMutationOptions<void, Error, [number, EditCustomerBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditCustomerBody]) =>
      editCustomer(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.CUSTOMER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteCustomer(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteCustomer(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.CUSTOMER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useBulkDeleteCustomers(
  props?: UseMutationOptions<void, Error, { ids: number[]; skipUndeletable?: boolean }>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({
      ids,
      skipUndeletable = false,
    }: {
      ids: number[];
      skipUndeletable?: boolean;
    }) =>
      bulkDeleteCustomers(fetcher, {
        ids,
        skipUndeletable,
      }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteCustomers(
  props?: UseMutationOptions<ValidateBulkDeleteCustomersResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteCustomers(fetcher, { ids, skipUndeletable: false }).then(
        (res) => transformToCamelCase(res as Record<string, unknown>) as ValidateBulkDeleteCustomersResponse
      ),
    ...props,
  });
}

export function useCreateCustomer(
  props?: UseMutationOptions<void, Error, CreateCustomerBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateCustomerBody) => createCustomer(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useCustomer(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Customer>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CUSTOMER, id],
    queryFn: () => fetchCustomer(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useEditCustomerOpeningBalance(
  props?: UseMutationOptions<unknown, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      editCustomerOpeningBalance(fetcher, id, values as Parameters<typeof editCustomerOpeningBalance>[2]),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.CUSTOMER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useRefreshCustomers() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] }),
  };
}
