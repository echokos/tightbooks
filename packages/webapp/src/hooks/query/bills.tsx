import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Bill,
  BillsListResponse,
  CreateBillBody,
  EditBillBody,
  GetBillsQuery,
  BulkDeleteBillsBody,
} from '@bigcapital/sdk-ts';
import {
  fetchBills,
  fetchBill,
  createBill,
  editBill,
  deleteBill,
  openBill,
  bulkDeleteBills,
  validateBulkDeleteBills,
  fetchDueBills,
  fetchBillPaymentTransactions,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformPagination } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.BILLS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });
  queryClient.invalidateQueries({ queryKey: [t.VENDORS] });
  queryClient.invalidateQueries({ queryKey: [t.VENDOR] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST_TRANSACTION] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_VENDOR_CREDIT] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_VENDOR_CREDITS] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS_ASSOCIATED_WITH_BILLS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_WAREHOUSES_LOCATION] });
  queryClient.invalidateQueries({
    queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES],
  });
};

export type BillsListResult = {
  bills: unknown[];
  pagination: ReturnType<typeof transformPagination>;
  filterMeta: Record<string, unknown>;
};

export function useCreateBill(
  props?: UseMutationOptions<void, Error, CreateBillBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateBillBody) => createBill(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useEditBill(
  props?: UseMutationOptions<void, Error, [number, EditBillBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditBillBody]) =>
      editBill(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.BILL, id] });
    },
    ...props,
  });
}

export function useOpenBill(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => openBill(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.BILL, id] });
    },
    ...props,
  });
}

export function useDeleteBill(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteBill(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.BILL, id] });
    },
    ...props,
  });
}

export type BulkDeleteBillsPayload = { ids: number[]; skipUndeletable?: boolean };

function toBulkDeleteBody(payload: BulkDeleteBillsPayload): BulkDeleteBillsBody {
  return {
    ids: payload.ids,
    skipUndeletable: payload.skipUndeletable ?? false,
  };
}

export function useBulkDeleteBills(
  props?: UseMutationOptions<void, Error, BulkDeleteBillsPayload>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (payload: BulkDeleteBillsPayload) =>
      bulkDeleteBills(fetcher, toBulkDeleteBody(payload)),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/** Response shape from bills validate-bulk-delete endpoint (see ValidateBulkDeleteResponseDto) */
export type ValidateBulkDeleteBillsResponse = {
  deletableCount: number;
  nonDeletableCount: number;
  deletableIds: number[];
  nonDeletableIds: number[];
};

export function useValidateBulkDeleteBills(
  props?: UseMutationOptions<ValidateBulkDeleteBillsResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteBills(fetcher, { ids, skipUndeletable: false }),
    ...props,
  });
}

/** API may return bills/data, pagination, and filter_meta (snake_case). */
type BillsListResponseShape = {
  bills?: unknown[];
  data?: unknown[];
  pagination?: unknown;
  filter_meta?: Record<string, unknown>;
};

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function transformBillsList(res: BillsListResponse & BillsListResponseShape): BillsListResult {
  const bills = res.bills ?? res.data ?? [];
  const pagination = res.pagination ?? {};
  const filterMeta = res.filter_meta;
  return {
    bills: Array.isArray(bills) ? bills : [],
    pagination: transformPagination(pagination),
    filterMeta: isRecord(filterMeta) ? filterMeta : {},
  };
}
export function useBills(
  query?: GetBillsQuery,
  props?: Omit<UseQueryOptions<BillsListResult>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BILLS, query],
    queryFn: () => fetchBills(fetcher, query).then(transformBillsList),
    ...props,
  });
}

export function useBill(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Bill>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BILL, id],
    queryFn: () => fetchBill(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useDueBills(
  vendorId: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BILLS, t.BILLS_DUE, vendorId],
    queryFn: () =>
      fetchDueBills(fetcher, vendorId != null ? { vendor_id: vendorId } : undefined),
    select: (data) => data ?? [],
    enabled: true,
    ...props,
  });
}

export function useRefreshBills() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.BILLS] }),
  };
}

export function useBillPaymentTransactions(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BILLS_PAYMENT_TRANSACTIONS, id],
    queryFn: () => fetchBillPaymentTransactions(fetcher, id!),
    select: (data) => data ?? [],
    enabled: id != null,
    ...props,
  });
}
