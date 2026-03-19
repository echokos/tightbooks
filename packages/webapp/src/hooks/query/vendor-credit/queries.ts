import {
  useQuery,
  useQueryClient,
  useMutation,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
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
import { useApiFetcher } from '../../useRequest';
import { vendorCreditsKeys, VendorCreditsQueryKeys } from './query-keys';
import { vendorsKeys } from '../vendors/query-keys';
import { itemsKeys } from '../items/query-keys';
import { accountsKeys } from '../accounts/query-keys';
import { billsKeys } from '../bills/query-keys';
import { organizationKeys } from '../organization/query-keys';

// Keys that don't have factory methods yet - keeping inline
const SETTING = 'SETTING';
const SETTING_VENDOR_CREDITS = 'SETTING_VENDOR_CREDITS';
const CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY = 'CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY';
const FINANCIAL_REPORT = 'FINANCIAL-REPORT';
const TRANSACTIONS_BY_REFERENCE = 'TRANSACTIONS_BY_REFERENCE';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.all() });
  queryClient.invalidateQueries({ queryKey: itemsKeys.all() });
  queryClient.invalidateQueries({ queryKey: vendorsKeys.all() });
  queryClient.invalidateQueries({ queryKey: accountsKeys.all() });
  queryClient.invalidateQueries({ queryKey: [SETTING, SETTING_VENDOR_CREDITS] });
  queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.refund(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.refundTransaction(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.reconcile(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.reconciles(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: billsKeys.all() });
  queryClient.invalidateQueries({ queryKey: [CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  queryClient.invalidateQueries({ queryKey: [FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: organizationKeys.mutateAbilities() });
};


/**
 * Create a new vendor credit.
 */
export function useCreateVendorCredit(
  props?: UseMutationOptions<void, Error, CreateVendorCreditBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values: CreateVendorCreditBody) => createVendorCredit(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    mutationFn: ([id, values]: [number, EditVendorCreditBody]) =>
      editVendorCredit(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.detail(id) });
    },
  });
}

/**
 * Delete the given vendor credit.
 */
export function useDeleteVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.detail(id) });
    },
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
    ...props,
    mutationFn: ({ ids, skipUndeletable = false }: { ids: number[]; skipUndeletable?: boolean }) =>
      bulkDeleteVendorCredits(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
  });
}

export function useValidateBulkDeleteVendorCredits(
  props?: UseMutationOptions<
    ValidateBulkDeleteVendorCreditsResponse,
    Error,
    number[]
  >
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (ids: number[]) =>
      validateBulkDeleteVendorCredits(fetcher, { ids } as BulkDeleteVendorCreditsBody),
  });
}

/**
 * Retrieve vendor credit notes list with pagination meta.
 */
export function useVendorCredits(
  query?: GetVendorCreditsQuery,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: vendorCreditsKeys.list(query),
    queryFn: () => fetchVendorCredits(fetcher, query),
  });
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
    ...props,
    queryKey: vendorCreditsKeys.detail(id),
    queryFn: () => fetchVendorCredit(fetcher, id!),
    enabled: id != null,
  });
}

export function useRefreshVendorCredits() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.all() });
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
    ...props,
    mutationFn: ([id, values]: [number, CreateRefundVendorCreditBody]) =>
      createRefundVendorCredit(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.detail(id) });
    },
  });
}

/**
 * Delete the given refund vendor credit.
 */
export function useDeleteRefundVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteRefundVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.refund(id) });
    },
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
    ...props,
    queryKey: vendorCreditsKeys.refund(id),
    queryFn: () => fetchVendorCreditRefunds(fetcher, id!),
    enabled: id != null,
  });
}

/**
 * Mark the given vendor credit as opened.
 */
export function useOpenVendorCredit(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => openVendorCredit(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.detail(id) });
    },
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
    ...props,
    mutationFn: ([id, values]: [number, ApplyVendorCreditToBillsBody]) =>
      applyVendorCreditToBills(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: vendorCreditsKeys.detail(id) });
    },
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
    ...props,
    queryKey: vendorCreditsKeys.reconcile(id),
    queryFn: () => fetchVendorCreditToApplyBills(fetcher, id!),
    enabled: id != null,
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
    ...props,
    queryKey: vendorCreditsKeys.reconciles(id),
    queryFn: () => fetchAppliedBillsToVendorCredit(fetcher, id!),
    enabled: id != null,
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
    ...props,
    mutationFn: (vendorCreditAppliedBillId: number) =>
      deleteAppliedBillToVendorCredit(fetcher, vendorCreditAppliedBillId),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    queryKey: vendorCreditsKeys.refundTransaction(id),
    queryFn: () => fetchRefundVendorCreditTransaction(fetcher, id!),
    enabled: id != null,
  });
}
