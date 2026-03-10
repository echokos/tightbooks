import {
  useQueryClient,
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type {
  CreditNote,
  CreateCreditNoteBody,
  EditCreditNoteBody,
  CreateRefundCreditNoteBody,
  ApplyCreditNoteToInvoicesBody,
  ValidateBulkDeleteCreditNotesResponse,
} from '@bigcapital/sdk-ts';
import type { CreditNotesListResponse } from '@bigcapital/sdk-ts';
import {
  fetchCreditNotes,
  fetchCreditNote,
  fetchCreditNoteState,
  fetchCreditNoteRefunds,
  fetchRefundCreditNoteTransaction,
  fetchCreditNoteAssociatedInvoicesToApply,
  fetchAppliedInvoices,
  createCreditNote,
  editCreditNote,
  deleteCreditNote,
  openCreditNote,
  validateBulkDeleteCreditNotes,
  bulkDeleteCreditNotes,
  createRefundCreditNote,
  deleteRefundCreditNote,
  applyCreditNoteToInvoices,
  deleteApplyCreditNoteToInvoices,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { useRequestPdf } from '../useRequestPdf';
import { transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  // Invalidate credit note.
  queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTES] });
  queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE] });

  // Invalidate items.
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });

  // Invalidate customers.
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMER] });
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] });

  // Invalidate accounts.
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });

  // Invalidate settings.
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_CREDIT_NOTES] });

  // Invalidate refund credit
  queryClient.invalidateQueries({ queryKey: [t.REFUND_CREDIT_NOTE] });
  queryClient.invalidateQueries({ queryKey: [t.REFUND_CREDIT_NOTE_TRANSACTION] });

  // Invalidate reconcile.
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTE] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTES] });

  // Invalidate invoices.
  queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICES] });
  queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE] });

  // Invalidate cashflow accounts.
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });

  // Invalidate financial reports.
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });

  // Invalidate transactions by reference.
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });

  // Invalidate mutate base currency abilities.
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

/**
 * Create a new credit note.
 */
export function useCreateCreditNote(
  props?: UseMutationOptions<void, Error, CreateCreditNoteBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateCreditNoteBody) => createCreditNote(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edit the given credit note.
 */
export function useEditCreditNote(
  props?: UseMutationOptions<void, Error, [number, EditCreditNoteBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditCreditNoteBody]) =>
      editCreditNote(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE, id] });
    },
    ...props,
  });
}

/**
 * Delete the given credit note.
 */
export function useDeleteCreditNote(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteCreditNote(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE, id] });
    },
    ...props,
  });
}

export function useBulkDeleteCreditNotes(
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
    }) => bulkDeleteCreditNotes(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteCreditNotes(
  props?: UseMutationOptions<ValidateBulkDeleteCreditNotesResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteCreditNotes(fetcher, { ids, skipUndeletable: false }).then(
        (res) => transformToCamelCase(res as Record<string, unknown>) as ValidateBulkDeleteCreditNotesResponse
      ),
    ...props,
  });
}

/**
 * Retrieve credit notes list with pagination meta.
 */
export function useCreditNotes(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<CreditNotesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CREDIT_NOTES, query],
    queryFn: () =>
      (fetchCreditNotes as (f: ReturnType<typeof useApiFetcher>, q?: Record<string, unknown>) => Promise<CreditNotesListResponse>)(
        fetcher,
        query
      ),
    ...props,
  });
}

export function useCreditNote(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<CreditNote>, 'queryKey' | 'queryFn'>,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CREDIT_NOTE, id],
    queryFn: () => fetchCreditNote(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useRefreshCreditNotes() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTES] });
    },
  };
}

export function useCreateRefundCreditNote(
  props?: UseMutationOptions<void, Error, [number, CreateRefundCreditNoteBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, CreateRefundCreditNoteBody]) =>
      createRefundCreditNote(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE, id] });
    },
    ...props,
  });
}

export function useDeleteRefundCreditNote(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (refundCreditId: number) => deleteRefundCreditNote(fetcher, refundCreditId),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Retrieve refund credit note detail of the given id.
 */
export function useRefundCreditNote(
  id: number | null | undefined,
  props?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchCreditNoteRefunds>>>,
    'queryKey' | 'queryFn'
  >,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.REFUND_CREDIT_NOTE, id],
    queryFn: () => fetchCreditNoteRefunds(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Mark the given credit note as opened.
 */
export function useOpenCreditNote(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => openCreditNote(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE, id] });
    },
    ...props,
  });
}

/**
 * Retrieve reconcile credit note of the given id.
 */
export function useReconcileCreditNote(
  id: number | null | undefined,
  props?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchCreditNoteAssociatedInvoicesToApply>>>,
    'queryKey' | 'queryFn'
  >,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.RECONCILE_CREDIT_NOTE, id],
    queryFn: () => fetchCreditNoteAssociatedInvoicesToApply(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Create Reconcile credit note.
 */
export function useCreateReconcileCreditNote(
  props?: UseMutationOptions<void, Error, [number, ApplyCreditNoteToInvoicesBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, ApplyCreditNoteToInvoicesBody]) =>
      applyCreditNoteToInvoices(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CREDIT_NOTE, id] });
    },
    ...props,
  });
}

/**
 * Retrieve reconcile credit notes (applied invoices).
 */
export function useReconcileCreditNotes(
  id: number | null | undefined,
  props?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchAppliedInvoices>>>,
    'queryKey' | 'queryFn'
  >,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.RECONCILE_CREDIT_NOTES, id],
    queryFn: () => fetchAppliedInvoices(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Delete the given reconcile credit note (applied invoice).
 */
export function useDeleteReconcileCredit(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (applyCreditToInvoicesId: number) =>
      deleteApplyCreditNoteToInvoices(fetcher, applyCreditToInvoicesId),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Retrieve refund credit transaction detail.
 */
export function useRefundCreditTransaction(
  id: number | null | undefined,
  props?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof fetchRefundCreditNoteTransaction>>>,
    'queryKey' | 'queryFn'
  >,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.REFUND_CREDIT_NOTE_TRANSACTION, id],
    queryFn: () => fetchRefundCreditNoteTransaction(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Retrieve the credit note pdf document data.
 */
export function usePdfCreditNote(creditNoteId: number | string) {
  return useRequestPdf({ url: `credit-notes/${creditNoteId}` });
}

export interface CreditNoteStateResponse {
  defaultTemplateId: number;
}

export function useGetCreditNoteState(
  options?: UseQueryOptions<CreditNoteStateResponse, Error>
): UseQueryResult<CreditNoteStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery<CreditNoteStateResponse, Error>({
    queryKey: ['CREDIT_NOTE_STATE'],
    queryFn: () =>
      fetchCreditNoteState(fetcher).then((data) =>
        transformToCamelCase(data as unknown as Record<string, unknown>) as CreditNoteStateResponse
      ),
    ...options,
  });
}
