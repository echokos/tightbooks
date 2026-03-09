import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  BillPaymentsListResponse,
  BillPayment,
  CreateBillPaymentBody,
  EditBillPaymentBody,
} from '@bigcapital/sdk-ts';
import {
  fetchBillPayments,
  fetchBillPayment,
  createBillPayment,
  editBillPayment,
  deleteBillPayment,
  fetchBillPaymentEditPage,
  fetchBillPaymentNewPageEntries,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformPagination } from '@/utils';
import t from './types';

const commonInvalidateQueries = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: [t.PAYMENT_MADES] });
  client.invalidateQueries({ queryKey: [t.PAYMENT_MADE_NEW_ENTRIES] });
  client.invalidateQueries({ queryKey: [t.PAYMENT_MADE_EDIT_PAGE] });
  client.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  client.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  client.invalidateQueries({ queryKey: [t.ACCOUNT] });
  client.invalidateQueries({ queryKey: [t.BILLS] });
  client.invalidateQueries({ queryKey: [t.BILL] });
  client.invalidateQueries({ queryKey: [t.VENDORS] });
  client.invalidateQueries({ queryKey: [t.VENDOR] });
  client.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  client.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  client.invalidateQueries({ queryKey: [t.BILLS_PAYMENT_TRANSACTIONS] });
};

export type PaymentMadesListResult = {
  paymentMades: unknown[];
  pagination: ReturnType<typeof transformPagination>;
  filterMeta: Record<string, unknown>;
};

function transformPaymentMades(data: BillPaymentsListResponse): PaymentMadesListResult {
  const raw = data as {
    bill_payments?: unknown[];
    pagination?: unknown;
    filter_meta?: Record<string, unknown>;
  };
  return {
    paymentMades: raw.bill_payments ?? (data as { data?: unknown[] })?.data ?? [],
    pagination: transformPagination(raw.pagination ?? {}),
    filterMeta: raw.filter_meta ?? {},
  };
}

export function usePaymentMades(
  query?: Record<string, unknown>,
  props?: Omit<
    UseQueryOptions<BillPaymentsListResponse, Error, PaymentMadesListResult>,
    'queryKey' | 'queryFn' | 'select'
  >
) {
  const fetcher = useApiFetcher();
  return useQuery<BillPaymentsListResponse, Error, PaymentMadesListResult>({
    queryKey: [t.PAYMENT_MADES, query],
    queryFn: () => fetchBillPayments(fetcher),
    select: transformPaymentMades,
    ...props,
  });
}

export function useCreatePaymentMade(
  props?: UseMutationOptions<void, Error, CreateBillPaymentBody>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateBillPaymentBody) =>
      createBillPayment(fetcher, values),
    onSuccess: () => commonInvalidateQueries(client),
    ...props,
  });
}

export function useEditPaymentMade(
  props?: UseMutationOptions<void, Error, [number, EditBillPaymentBody]>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditBillPaymentBody]) =>
      editBillPayment(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(client);
      client.invalidateQueries({ queryKey: [t.PAYMENT_MADE, id] });
    },
    ...props,
  });
}

export function useDeletePaymentMade(
  props?: UseMutationOptions<void, Error, number>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteBillPayment(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(client);
      client.invalidateQueries({ queryKey: [t.PAYMENT_MADE, id] });
    },
    ...props,
  });
}

export function usePaymentMadeEditPage(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_MADE_EDIT_PAGE, id],
    queryFn: () => fetchBillPaymentEditPage(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/** New page entries – uses vendorId param via SDK. */
export function usePaymentMadeNewPageEntries(
  vendorId: number | null | undefined,
  props?: Omit<
    UseQueryOptions<unknown, Error, unknown>,
    'queryKey' | 'queryFn' | 'enabled'
  >
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_MADE_NEW_ENTRIES, vendorId],
    queryFn: () => fetchBillPaymentNewPageEntries(fetcher, vendorId!),
    enabled: vendorId != null,
    select: (data) => data ?? [],
    ...props,
  });
}

export function useRefreshPaymentMades() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.PAYMENT_MADES] }),
  };
}

export function usePaymentMade(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<BillPayment>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_MADE, id],
    queryFn: () => fetchBillPayment(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}
