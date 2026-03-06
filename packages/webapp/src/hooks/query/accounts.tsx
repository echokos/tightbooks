import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Account,
  AccountsList,
  CreateAccountBody,
  EditAccountBody,
  GetAccountsQuery,
  ValidateBulkDeleteResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchAccounts,
  fetchAccount,
  fetchAccountTypes,
  fetchAccountTransactions,
  createAccount,
  editAccount,
  deleteAccount,
  activateAccount,
  inactivateAccount,
  bulkDeleteAccounts,
  validateBulkDeleteAccounts,
  AccountTypesList,
  AccountTransactionsList
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';
import { transformToCamelCase } from '@/utils';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
};

export function useAccounts(
  query?: GetAccountsQuery | null,
  props?: Omit<UseQueryOptions<AccountsList>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ACCOUNTS, query],
    queryFn: () => fetchAccounts(fetcher, query ?? {}),
    select: (data: AccountsList) => data,
    ...props,
  });
}

export function useAccount(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Account>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ACCOUNT, id],
    queryFn: () => fetchAccount(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useAccountsTypes(
  props?: Omit<UseQueryOptions<AccountTypesList>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ACCOUNTS_TYPES],
    queryFn: () => fetchAccountTypes(fetcher),
    ...props,
  });
}

export function useCreateAccount(
  props?: UseMutationOptions<void, Error, CreateAccountBody>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateAccountBody) => createAccount(fetcher, values),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useEditAccount(
  props?: UseMutationOptions<void, Error, [number, EditAccountBody]>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditAccountBody]) =>
      editAccount(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useDeleteAccount(
  props?: UseMutationOptions<void, Error, number>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteAccount(fetcher, id),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useActivateAccount(
  props?: UseMutationOptions<void, Error, number>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => activateAccount(fetcher, id),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useInactivateAccount(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => inactivateAccount(fetcher, id),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useBulkDeleteAccounts(
  props?: UseMutationOptions<
    void,
    Error,
    { ids: number[]; skipUndeletable?: boolean }
  >
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
    }) => bulkDeleteAccounts(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteAccounts(
  props?: UseMutationOptions<ValidateBulkDeleteResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteAccounts(fetcher, ids).then((res: ValidateBulkDeleteResponse) =>
        transformToCamelCase(res as unknown as Record<string, unknown>) as ValidateBulkDeleteResponse
      ),
    ...props,
  });
}

export function useAccountTransactions(
  id: number | null | undefined,
  props?: Omit<
    UseQueryOptions<AccountTransactionsList>,
    'queryKey' | 'queryFn'
  >
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ACCOUNT_TRANSACTION, id],
    queryFn: () => fetchAccountTransactions(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useRefreshAccounts() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
    },
  };
}
