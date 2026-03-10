import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CreateManualJournalBody,
  EditManualJournalBody,
  ManualJournal,
  ManualJournalsListQuery,
  ManualJournalsListResponse,
  BulkDeleteManualJournalsBody,
  ValidateBulkDeleteManualJournalsResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchManualJournals,
  fetchManualJournal,
  createManualJournal,
  editManualJournal,
  deleteManualJournal,
  publishManualJournal,
  bulkDeleteManualJournals,
  validateBulkDeleteManualJournals,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  // Invalidate manual journals.
  queryClient.invalidateQueries({ queryKey: [t.MANUAL_JOURNALS] });

  // Invalidate customers.
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] });
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMER] });

  // Invalidate vendors.
  queryClient.invalidateQueries({ queryKey: [t.VENDORS] });
  queryClient.invalidateQueries({ queryKey: [t.VENDOR] });

  // Invalidate accounts.
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });

  // Invalidate settings.
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_MANUAL_JOURNALS] });

  // Invalidate financial reports.
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });

  // Invalidate the cashflow transactions.
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
};

/**
 * Creates a new manual journal.
 */
export function useCreateJournal(
  props?: UseMutationOptions<void, Error, CreateManualJournalBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateManualJournalBody) =>
      createManualJournal(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useEditJournal(
  props?: UseMutationOptions<void, Error, [number, EditManualJournalBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditManualJournalBody]) =>
      editManualJournal(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.MANUAL_JOURNAL, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteJournal(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteManualJournal(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.MANUAL_JOURNAL, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useBulkDeleteManualJournals(
  props?: UseMutationOptions<void, Error, BulkDeleteManualJournalsBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({
      ids,
      skipUndeletable = false,
    }: BulkDeleteManualJournalsBody) =>
      bulkDeleteManualJournals(fetcher, { ids, skipUndeletable }),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useValidateBulkDeleteManualJournals(
  props?: UseMutationOptions<
    ValidateBulkDeleteManualJournalsResponse,
    Error,
    number[]
  >
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteManualJournals(fetcher, { ids }).then((res) =>
        transformToCamelCase(res as unknown as Record<string, unknown>) as ValidateBulkDeleteManualJournalsResponse
      ),
    ...props,
  });
}

export function usePublishJournal(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => publishManualJournal(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.MANUAL_JOURNAL, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useJournals(
  query?: ManualJournalsListQuery | null,
  props?: Omit<UseQueryOptions<ManualJournalsListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.MANUAL_JOURNALS, query],
    queryFn: async () =>
      fetchManualJournals(fetcher, query ?? {}),
    ...props,
  });
}

export function useJournal(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<ManualJournal>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.MANUAL_JOURNAL, id],
    queryFn: () => fetchManualJournal(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useRefreshJournals() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.MANUAL_JOURNALS] });
    },
  };
}
