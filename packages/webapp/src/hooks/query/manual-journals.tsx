// @ts-nocheck
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CreateManualJournalBody,
  EditManualJournalBody,
  ManualJournalsListResponse,
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
import { transformPagination, transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (client) => {
  // Invalidate manual journals.
  client.invalidateQueries({ queryKey: [t.MANUAL_JOURNALS] });

  // Invalidate customers.
  client.invalidateQueries({ queryKey: [t.CUSTOMERS] });
  client.invalidateQueries({ queryKey: [t.CUSTOMER] });

  // Invalidate vendors.
  client.invalidateQueries({ queryKey: [t.VENDORS] });
  client.invalidateQueries({ queryKey: [t.VENDOR] });

  // Invalidate accounts.
  client.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  client.invalidateQueries({ queryKey: [t.ACCOUNT] });

  // Invalidate settings.
  client.invalidateQueries([t.SETTING, t.SETTING_MANUAL_JOURNALS]);

  // Invalidate financial reports.
  client.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });

  // Invalidate the cashflow transactions.
  client.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  client.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
};

/**
 * Creates a new manual journal.
 */
export function useCreateJournal(props) {
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

/**
 * Edits the given manual journal.
 */
export function useEditJournal(props) {
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

/**
 * Deletes the given manual journal.
 */
export function useDeleteJournal(props) {
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

/**
 * Deletes multiple manual journals in bulk.
 */
export function useBulkDeleteManualJournals(props) {
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
      bulkDeleteManualJournals(fetcher, { ids, skipUndeletable }),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useValidateBulkDeleteManualJournals(props) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteManualJournals(fetcher, { ids }).then((res) =>
        transformToCamelCase(res)
      ),
    ...props,
  });
}

/**
 * Publishes the given manual journal.
 */
export function usePublishJournal(props) {
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

function transformJournalsList(
  data: ManualJournalsListResponse
): {
  manualJournals: unknown[];
  pagination: ReturnType<typeof transformPagination>;
  filterMeta: Record<string, unknown>;
} {
  const raw = data as {
    manual_journals?: unknown[];
    manualJournals?: unknown[];
    pagination?: unknown;
    filter_meta?: Record<string, unknown>;
    filterMeta?: Record<string, unknown>;
  };
  return {
    manualJournals: raw?.manual_journals ?? raw?.manualJournals ?? [],
    pagination: transformPagination(raw?.pagination ?? {}),
    filterMeta: raw?.filter_meta ?? raw?.filterMeta ?? {},
  };
}

/**
 * Retrieve the manual journals with pagination meta.
 */
export function useJournals(query, props) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.MANUAL_JOURNALS, query],
    queryFn: () => fetchManualJournals(fetcher, query),
    select: transformJournalsList,
    ...props,
  });
}

/**
 * Retrieve the manual journal details.
 */
export function useJournal(id, props) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.MANUAL_JOURNAL, id],
    queryFn: () => fetchManualJournal(fetcher, id),
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
