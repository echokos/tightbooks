import {
  useMutation,
  useQueryClient,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import type {
  PaymentsReceivedListResponse,
  PaymentReceived,
  CreatePaymentReceivedBody,
  EditPaymentReceivedBody,
} from '@bigcapital/sdk-ts';
import {
  fetchPaymentsReceived,
  fetchPaymentReceived,
  createPaymentReceived,
  editPaymentReceived,
  deletePaymentReceived,
  bulkDeletePaymentsReceived,
  validateBulkDeletePaymentsReceived,
  fetchPaymentReceiveEditPage,
  fetchPaymentReceiveMail,
  sendPaymentReceiveMail,
  fetchPaymentReceivedState,
} from '@bigcapital/sdk-ts';

export type BulkDeletePaymentsReceivedBody = { ids: number[]; skipUndeletable?: boolean };
export type ValidateBulkDeletePaymentsReceivedResponse = {
  deletableCount: number;
  nonDeletableCount: number;
  deletableIds: number[];
  nonDeletableIds: number[];
};
import useApiRequest, { useApiFetcher } from '../useRequest';
import { useRequestQuery } from '../useQueryRequest';
import { saveInvoke, transformToCamelCase } from '@/utils';
import { useRequestPdf } from '../useRequestPdf';
import t from './types';

const commonInvalidateQueries = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVES] });
  client.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVE_EDIT_PAGE] });
  client.invalidateQueries({ queryKey: [t.SALE_INVOICES] });
  client.invalidateQueries({ queryKey: [t.SALE_INVOICE] });
  client.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  client.invalidateQueries({ queryKey: [t.ACCOUNT] });
  client.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  client.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });
  client.invalidateQueries({ queryKey: [t.CUSTOMERS] });
  client.invalidateQueries({ queryKey: [t.CUSTOMER] });
  client.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  client.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  client.invalidateQueries({ queryKey: [t.CREDIT_NOTE] });
  client.invalidateQueries({ queryKey: [t.CREDIT_NOTES] });
  client.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTE] });
  client.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTES] });
  client.invalidateQueries({ queryKey: [t.SALE_INVOICE_PAYMENT_TRANSACTIONS] });
};

export function usePaymentReceives(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<PaymentsReceivedListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_RECEIVES, query],
    queryFn: () => fetchPaymentsReceived(fetcher, query),
    ...props,
  });
}

export function useCreatePaymentReceive(
  props?: UseMutationOptions<void, Error, CreatePaymentReceivedBody>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreatePaymentReceivedBody) =>
      createPaymentReceived(fetcher, values),
    onSuccess: (data, _values) => {
      commonInvalidateQueries(client);
      client.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_PAYMENT_RECEIVES] });
      saveInvoke(props?.onSuccess, data);
    },
    ...props,
  });
}

export function useEditPaymentReceive(
  props?: UseMutationOptions<void, Error, [number, EditPaymentReceivedBody]>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditPaymentReceivedBody]) =>
      editPaymentReceived(fetcher, id, values),
    onSuccess: (data, [id]) => {
      client.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVE, id] });
      commonInvalidateQueries(client);
      saveInvoke(props?.onSuccess, data);
    },
    ...props,
  });
}

export function useDeletePaymentReceive(
  props?: UseMutationOptions<void, Error, number>
) {
  const client = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deletePaymentReceived(fetcher, id),
    onSuccess: (data, id) => {
      client.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVE, id] });
      commonInvalidateQueries(client);
      saveInvoke(props?.onSuccess, data);
    },
    ...props,
  });
}

export function useBulkDeletePaymentReceives(
  props?: UseMutationOptions<void, Error, BulkDeletePaymentsReceivedBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (body: BulkDeletePaymentsReceivedBody) =>
      bulkDeletePaymentsReceived(fetcher, body),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeletePaymentReceives(
  props?: UseMutationOptions<ValidateBulkDeletePaymentsReceivedResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeletePaymentsReceived(fetcher, ids).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as ValidateBulkDeletePaymentsReceivedResponse
      ),
    ...props,
  });
}

export function usePaymentReceive(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<PaymentReceived>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_RECEIVE, id],
    queryFn: () => fetchPaymentReceived(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function usePaymentReceiveEditPage(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.PAYMENT_RECEIVE_EDIT_PAGE, id],
    queryFn: () => fetchPaymentReceiveEditPage(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useRefreshPaymentReceive() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVES] }),
  };
}

/** Notify by SMS – no SDK route in schema; kept on apiRequest. */
export function useCreateNotifyPaymentReceiveBySMS(
  props?: UseMutationOptions<unknown, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.post(`payments-received/${id}/notify-by-sms`, values, {}),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.NOTIFY_PAYMENT_RECEIVE_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/** SMS detail – no SDK route in schema; kept on useRequestQuery. */
export function usePaymentReceiveSMSDetail(
  paymentReceiveId: number | null | undefined,
  props?: Record<string, unknown>,
  requestProps?: Record<string, unknown>
) {
  return useRequestQuery(
    [t.PAYMENT_RECEIVE_SMS_DETAIL, paymentReceiveId],
    {
      method: 'get',
      url: `payments-received/${paymentReceiveId}/sms-details`,
      ...requestProps,
    },
    {
      select: (res: { data: unknown }) => res.data,
      defaultData: {},
      ...props,
    },
  );
}

export function usePdfPaymentReceive(paymentReceiveId: number) {
  return useRequestPdf({ url: `payments-received/${paymentReceiveId}` });
}

interface SendPaymentReceiveMailValues {
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject: string;
  message: string;
  from?: string[] | string;
  attachPdf?: boolean;
}

interface SendPaymentReceiveMailResponse {
  success: boolean;
  message?: string;
}

export function useSendPaymentReceiveMail(
  props?: UseMutationOptions<
    SendPaymentReceiveMailResponse,
    Error,
    [number, SendPaymentReceiveMailValues]
  >
): UseMutationResult<
  SendPaymentReceiveMailResponse,
  Error,
  [number, SendPaymentReceiveMailValues],
  unknown
> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, SendPaymentReceiveMailValues]) =>
      sendPaymentReceiveMail(fetcher, id, values as unknown as Record<string, unknown>) as Promise<SendPaymentReceiveMailResponse>,
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export interface GetPaymentReceivedMailStateResponse {
  companyName: string;
  companyLogoUri?: string;
  primaryColor?: string;
  customerName: string;
  entries: Array<{ invoiceNumber: string; paidAmount: string }>;
  from: Array<string>;
  fromOptions: Array<{ mail: string; label: string; primary: boolean }>;
  paymentDate: string;
  paymentDateFormatted: string;
  to: Array<string>;
  toOptions: Array<{ mail: string; label: string; primary: boolean }>;
  total: number;
  totalFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  paymentNumber: string;
  formatArgs: Record<string, unknown>;
}

export function usePaymentReceivedMailState(
  paymentReceiveId: number,
  props?: UseQueryOptions<GetPaymentReceivedMailStateResponse, Error>
): UseQueryResult<GetPaymentReceivedMailStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.PAYMENT_RECEIVE_MAIL_OPTIONS, paymentReceiveId],
    queryFn: () =>
      fetchPaymentReceiveMail(fetcher, paymentReceiveId).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as GetPaymentReceivedMailStateResponse
      ),
    ...props,
  });
}

export interface PaymentReceivedStateResponse {
  defaultTemplateId: number;
}

export function usePaymentReceivedState(
  options?: UseQueryOptions<PaymentReceivedStateResponse, Error>
): UseQueryResult<PaymentReceivedStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['PAYMENT_RECEIVED_STATE'],
    queryFn: () =>
      fetchPaymentReceivedState(fetcher).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as PaymentReceivedStateResponse
      ),
    ...options,
  });
}

interface PaymentReceivedHtmlResponse {
  htmlContent: string;
}

/** HTML content uses custom Accept header; kept on apiRequest. */
export function useGetPaymentReceiveHtml(
  paymentReceivedId: number,
  options?: UseQueryOptions<PaymentReceivedHtmlResponse, Error>
): UseQueryResult<PaymentReceivedHtmlResponse, Error> {
  const apiRequest = useApiRequest();

  return useQuery({
    queryKey: ['PAYMENT_RECEIVED_HTML', paymentReceivedId],
    queryFn: (): Promise<PaymentReceivedHtmlResponse> =>
      apiRequest
        .get(`/payments-received/${paymentReceivedId}`, {
          headers: { Accept: 'application/json+html' },
        })
        .then((res) => transformToCamelCase(res.data) as PaymentReceivedHtmlResponse),
    ...options,
  });
}
