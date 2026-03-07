import {
  useQuery,
  useQueryClient,
  useMutation,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { defaultTo } from 'lodash';
import type {
  CreateVendorCreditBody,
  EditVendorCreditBody,
  GetVendorCreditsQuery,
  BulkDeleteVendorCreditsBody,
  CreateRefundVendorCreditBody,
  ApplyVendorCreditToBillsBody,
  ValidateBulkDeleteVendorCreditsResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchVendorCredits,
  fetchVendorCredit,
  createVendorCredit,
  editVendorCredit,
  deleteVendorCredit,
  openVendorCredit,
  bulkDeleteVendorCredits,
  validateBulkDeleteVendorCredits,
  fetchVendorCreditRefunds,
  createRefundVendorCredit,
  fetchRefundVendorCreditTransaction,
  deleteRefundVendorCredit,
  fetchVendorCreditToApplyBills,
  applyVendorCreditToBills,
  fetchAppliedBillsToVendorCredit,
  deleteAppliedBillToVendorCredit,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformPagination, transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDITS] });
  queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });
  queryClient.invalidateQueries({ queryKey: [t.VENDORS] });
  queryClient.invalidateQueries({ queryKey: [t.VENDOR] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_VENDOR_CREDITS] });
  queryClient.invalidateQueries({ queryKey: [t.REFUND_VENDOR_CREDIT] });
  queryClient.invalidateQueries({ queryKey: [t.REFUND_VENDOR_CREDIT_TRANSACTION] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_VENDOR_CREDIT] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_VENDOR_CREDITS] });
  queryClient.invalidateQueries({ queryKey: [t.BILL] });
  queryClient.invalidateQueries({ queryKey: [t.BILLS] });
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

export type VendorCreditsListResult = {
  vendorCredits: unknown[];
  pagination: ReturnType<typeof transformPagination>;
  filterMeta: Record<string, unknown>;
};

const DEFAULT_VENDOR_CREDITS_PLACEHOLDER: VendorCreditsListResult = {
  vendorCredits: [],
  pagination: transformPagination({}),
  filterMeta: {},
};

function transformVendorCreditsResponse(response: Record<string, unknown>): VendorCreditsListResult {
  const raw = response as {
    vendor_credits?: unknown[];
    vendorCredits?: unknown[];
    pagination?: unknown;
    filter_meta?: Record<string, unknown>;
    filterMeta?: Record<string, unknown>;
  };
  return {
    vendorCredits: raw.vendor_credits ?? raw.vendorCredits ?? [],
    pagination: transformPagination(raw.pagination ?? {}),
    filterMeta: raw.filter_meta ?? raw.filterMeta ?? {},
  };
}

/**
 * Create a new vendor credit.
 */
export function useCreateVendorCredit(
  props?: UseMutationOptions<void, Error, CreateVendorCreditBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateVendorCreditBody) => createVendorCredit(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edit the given vendor credit.
 */
export function useEditVendorCredit(
  props?: UseMutationOptions<void, Error, [number, EditVendorCreditBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditVendorCreditBody]) =>
      editVendorCredit(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Delete the given vendor credit.
 */
export function useDeleteVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Deletes multiple vendor credits in bulk.
 */
export function useBulkDeleteVendorCredits(
  props?: UseMutationOptions<void, Error, { ids: number[]; skipUndeletable?: boolean }>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({ ids, skipUndeletable = false }: { ids: number[]; skipUndeletable?: boolean }) =>
      bulkDeleteVendorCredits(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteVendorCredits(
  props?: UseMutationOptions<
    ValidateBulkDeleteVendorCreditsResponse,
    Error,
    number[]
  >
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteVendorCredits(fetcher, { ids } as BulkDeleteVendorCreditsBody).then(
        (data: Record<string, unknown>) => transformToCamelCase(data) as ValidateBulkDeleteVendorCreditsResponse
      ),
    ...props,
  });
}

/**
 * Retrieve vendor credit notes list with pagination meta.
 */
export function useVendorCredits(
  query?: GetVendorCreditsQuery,
  props?: Omit<UseQueryOptions<VendorCreditsListResult>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  const result = useQuery({
    queryKey: [t.VENDOR_CREDITS, query],
    queryFn: () =>
      fetchVendorCredits(fetcher, query).then((data: Record<string, unknown>) =>
        transformVendorCreditsResponse(data)
      ),
    ...props,
  });

  return {
    ...result,
    data: defaultTo(result.data, DEFAULT_VENDOR_CREDITS_PLACEHOLDER),
  };
}

/**
 * Retrieve vendor credit detail of the given id.
 */
export function useVendorCredit(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>,
  _requestProps?: unknown
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.VENDOR_CREDIT, id],
    queryFn: () => fetchVendorCredit(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useRefreshVendorCredits() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDITS] });
    },
  };
}

/**
 * Create refund vendor credit.
 */
export function useCreateRefundVendorCredit(
  props?: UseMutationOptions<void, Error, [number, CreateRefundVendorCreditBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, CreateRefundVendorCreditBody]) =>
      createRefundVendorCredit(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Delete the given refund vendor credit.
 */
export function useDeleteRefundVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteRefundVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.REFUND_VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Retrieve refund vendor credit graph (list) for the given vendor credit id.
 */
export function useRefundVendorCredit(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>,
  _requestProps?: unknown
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.REFUND_VENDOR_CREDIT, id],
    queryFn: () => fetchVendorCreditRefunds(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Mark the given vendor credit as opened.
 */
export function useOpenVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => openVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Create reconcile vendor credit (apply to bills).
 */
export function useCreateReconcileVendorCredit(
  props?: UseMutationOptions<void, Error, [number, ApplyVendorCreditToBillsBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, ApplyVendorCreditToBillsBody]) =>
      applyVendorCreditToBills(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.VENDOR_CREDIT, id] });
    },
    ...props,
  });
}

/**
 * Retrieve reconcile vendor credit form (bills to apply) for the given id.
 */
export function useReconcileVendorCredit(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>,
  _requestProps?: unknown
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.RECONCILE_VENDOR_CREDIT, id],
    queryFn: () => fetchVendorCreditToApplyBills(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Retrieve applied bills to vendor credit for the given id.
 */
export function useReconcileVendorCredits(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>,
  _requestProps?: unknown
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.RECONCILE_VENDOR_CREDITS, id],
    queryFn: () => fetchAppliedBillsToVendorCredit(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Delete the given reconcile vendor credit (applied bill).
 */
export function useDeleteReconcileVendorCredit(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (vendorCreditAppliedBillId: number) =>
      deleteAppliedBillToVendorCredit(fetcher, vendorCreditAppliedBillId),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Retrieve refund vendor credit transaction detail by id.
 */
export function useRefundVendorCreditTransaction(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>,
  _requestProps?: unknown
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.REFUND_VENDOR_CREDIT_TRANSACTION, id],
    queryFn: () => fetchRefundVendorCreditTransaction(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}
