import {
  useQueryClient,
  useMutation,
  useQuery,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type {
  SaleInvoicesListResponse,
  SaleInvoice,
  CreateSaleInvoiceBody,
  EditSaleInvoiceBody,
  GetSaleInvoicesQuery,
  ValidateBulkDeleteSaleInvoicesResponse,
  SaleInvoiceStateResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchSaleInvoices,
  fetchSaleInvoice,
  createSaleInvoice,
  editSaleInvoice,
  deleteSaleInvoice,
  bulkDeleteSaleInvoices,
  validateBulkDeleteSaleInvoices,
  deliverSaleInvoice,
  writeOffSaleInvoice,
  cancelWrittenOffSaleInvoice,
  fetchReceivableSaleInvoices,
  fetchSaleInvoiceMailState,
  sendSaleInvoiceMail,
  fetchSaleInvoiceState,
  fetchInvoicePayments,
  fetchSaleInvoiceHtml,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { useRequestQuery } from '../useQueryRequest';
import { transformToCamelCase } from '@/utils';
import useApiRequest from '../useRequest';
import { useRequestPdf } from '../useRequestPdf';
import t from './types';

function commonInvalidateQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICES] });
  queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE] });
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_INVOICES] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTE] });
  queryClient.invalidateQueries({ queryKey: [t.RECONCILE_CREDIT_NOTES] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_ASSOCIATED_WITH_INVOICES] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_WAREHOUSES_LOCATION] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
}

/**
 * Creates a new sale invoice.
 */
export function useCreateInvoice(
  props?: UseMutationOptions<void, Error, CreateSaleInvoiceBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateSaleInvoiceBody) => createSaleInvoice(fetcher, values),
    onSuccess: (_data, values) => {
      const customerId = (values as { customer_id?: number }).customer_id;
      if (customerId != null) {
        queryClient.invalidateQueries({ queryKey: [t.CUSTOMER, customerId] });
      }
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATES] });
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Edits the given sale invoice.
 */
export function useEditInvoice(
  props?: UseMutationOptions<void, Error, [number, EditSaleInvoiceBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditSaleInvoiceBody]) =>
      editSaleInvoice(fetcher, id, values),
    onSuccess: (_data, [id, values]) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE, id] });
      const customerId = (values as { customer_id?: number }).customer_id;
      if (customerId != null) {
        queryClient.invalidateQueries({ queryKey: [t.CUSTOMER, customerId] });
      }
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given sale invoice.
 */
export function useDeleteInvoice(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteSaleInvoice(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE, id] });
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATES] });
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes multiple sale invoices in bulk.
 */
export function useBulkDeleteInvoices(
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
    }) => bulkDeleteSaleInvoices(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export type ValidateBulkDeleteInvoicesResponse = ValidateBulkDeleteSaleInvoicesResponse;

export function useValidateBulkDeleteInvoices(
  props?: UseMutationOptions<ValidateBulkDeleteInvoicesResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) => validateBulkDeleteSaleInvoices(fetcher, ids),
    ...props,
  });
}

/**
 * Retrieve sale invoices list with pagination meta.
 */
export function useInvoices(
  query?: GetSaleInvoicesQuery,
  props?: UseQueryOptions<SaleInvoicesListResponse, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_INVOICES, query],
    queryFn: () => fetchSaleInvoices(fetcher, query),
    ...props,
  });
}

/**
 * Marks the sale invoice as delivered.
 */
export function useDeliverInvoice(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (invoiceId: number) => deliverSaleInvoice(fetcher, invoiceId),
    onSuccess: (_data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE, invoiceId] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieve the sale invoice details.
 */
export function useInvoice(
  invoiceId: number | null | undefined,
  props?: UseQueryOptions<SaleInvoice, Error>,
  requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_INVOICE, invoiceId],
    queryFn: () => fetchSaleInvoice(fetcher, invoiceId as number),
    enabled: invoiceId != null,
    ...requestProps,
    ...props,
  });
}

/**
 * Retrieve the invoice pdf document data.
 */
export function usePdfInvoice(invoiceId: number) {
  return useRequestPdf({
    url: `sale-invoices/${invoiceId}`,
  });
}

interface GetInvoiceHtmlResponse {
  htmlContent: string;
}

/**
 * Retrieves the invoice html content.
 */
export function useInvoiceHtml(
  invoiceId: number,
  options?: UseQueryOptions<GetInvoiceHtmlResponse, Error>
): UseQueryResult<GetInvoiceHtmlResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['SALE_INVOICE_HTML', invoiceId],
    queryFn: () =>
      fetchSaleInvoiceHtml(fetcher, invoiceId).then((data: { htmlContent: string }) =>
        transformToCamelCase(data) as GetInvoiceHtmlResponse
      ),
    ...options,
  });
}

/**
 * Retrieve due (receivable) invoices of the given customer id.
 */
export function useDueInvoices(
  customerId: number | null | undefined,
  props?: UseQueryOptions<unknown, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_INVOICES, t.SALE_INVOICES_DUE, customerId],
    queryFn: () => fetchReceivableSaleInvoices(fetcher, customerId ?? undefined),
    enabled: customerId != null,
    ...props,
  });
}

export function useRefreshInvoices() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICES] });
    },
  };
}

export function useCreateBadDebt(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      writeOffSaleInvoice(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.BAD_DEBT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useCancelBadDebt(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => cancelWrittenOffSaleInvoice(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.CANCEL_BAD_DEBT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

// Not in OpenAPI schema for sale-invoices; keep using apiRequest.
export function useCreateNotifyInvoiceBySMS(
  props?: UseMutationOptions<unknown, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.post(`sale-invoices/${id}/notify-by-sms`, values, {}),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.NOTIFY_SALE_INVOICE_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

// Not in OpenAPI schema for sale-invoices; keep using useRequestQuery.
export function useInvoiceSMSDetail(
  invoiceId: number,
  query?: Record<string, unknown>,
  props?: Record<string, unknown>
) {
  return useRequestQuery(
    [t.SALE_INVOICE_SMS_DETAIL, invoiceId, query],
    {
      method: 'get',
      url: `sale-invoices/${invoiceId}/sms-details`,
      params: query,
    } as { method: string; url: string; params?: Record<string, unknown> },
    {
      select: (res: { data: unknown }) => res.data,
      defaultData: {},
      ...props,
    }
  );
}

export function useInvoicePaymentTransactions(
  invoiceId: number,
  props?: UseQueryOptions<unknown, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_INVOICE_PAYMENT_TRANSACTIONS, invoiceId],
    queryFn: () => fetchInvoicePayments(fetcher, invoiceId),
    ...props,
  });
}

// # Send sale invoice mail.
export interface SendSaleInvoiceMailValues {
  id: number;
  values: {
    subject: string;
    message: string;
    to: Array<string>;
    cc?: Array<string>;
    bcc?: Array<string>;
    attachInvoice?: boolean;
  };
}

export type SendSaleInvoiceMailResponse = void;

export function useSendSaleInvoiceMail(
  options?: UseMutationOptions<
    SendSaleInvoiceMailResponse,
    Error,
    SendSaleInvoiceMailValues
  >,
): UseMutationResult<
  SendSaleInvoiceMailResponse,
  Error,
  SendSaleInvoiceMailValues
> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (value: SendSaleInvoiceMailValues) =>
      sendSaleInvoiceMail(fetcher, value.id, value.values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...options,
  });
}

// # Get sale invoice mail state.
export interface GetSaleInvoiceDefaultOptionsResponse {
  companyName: string;
  companyLogoUri: string;
  customerName: string;
  dueDate: string;
  dueDateFormatted: string;
  dueAmount: number;
  dueAmountFormatted: string;
  entries: Array<{
    quantity: number;
    quantityFormatted: string;
    rate: number;
    rateFormatted: string;
    total: number;
    totalFormatted: string;
  }>;
  formatArgs: Record<string, string>;
  from: string[];
  to: string[];
  invoiceDate: string;
  invoiceDateFormatted: string;
  invoiceNo: string;
  message: string;
  subject: string;
  subtotal: number;
  subtotalFormatted: string;
  discountAmount: number;
  discountAmountFormatted: string;
  discountLabel: string;
  discountPercentage: number;
  discountPercentageFormatted: string;
  adjustment: number;
  adjustmentFormatted: string;
  total: number;
  totalFormatted: string;
  attachInvoice: boolean;
  primaryColor: string;
}

export function useSaleInvoiceMailState(
  invoiceId: number,
  options?: UseQueryOptions<GetSaleInvoiceDefaultOptionsResponse, Error>
): UseQueryResult<GetSaleInvoiceDefaultOptionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_INVOICE_DEFAULT_OPTIONS, invoiceId],
    queryFn: () =>
      fetchSaleInvoiceMailState(fetcher, invoiceId).then((data: unknown) =>
        transformToCamelCase(data) as GetSaleInvoiceDefaultOptionsResponse
      ),
    ...options,
  });
}

// # Get sale invoice state.
export type GetSaleInvoiceStateResponse = SaleInvoiceStateResponse;

export function useGetSaleInvoiceState(
  options?: UseQueryOptions<GetSaleInvoiceStateResponse, Error>
): UseQueryResult<GetSaleInvoiceStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['SALE_INVOICE_STATE'],
    queryFn: () =>
      fetchSaleInvoiceState(fetcher).then((data: GetSaleInvoiceStateResponse & { data?: unknown }) =>
        transformToCamelCase(data?.data ?? data) as GetSaleInvoiceStateResponse
      ),
    ...options,
  });
}

// # Get sale invoice branding template — not in OpenAPI schema; keep apiRequest.
export interface GetSaleInvoiceBrandingTemplateResponse {
  id: number;
  default: number;
  predefined: number;
  resource: string;
  resourceFormatted: string;
  templateName: string;
  updatedAt: string;
  createdAt: string;
  createdAtFormatted: string;
  attributes: {
    billedToLabel?: string;
    companyLogoKey?: string | null;
    companyLogoUri?: string;
    dateIssueLabel?: string;
    discountLabel?: string;
    dueAmountLabel?: string;
    dueDateLabel?: string;
    invoiceNumberLabel?: string;
    itemDescriptionLabel?: string;
    itemNameLabel?: string;
    itemRateLabel?: string;
    itemTotalLabel?: string;
    paymentMadeLabel?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showCompanyAddress?: boolean;
    showCompanyLogo?: boolean;
    showCustomerAddress?: boolean;
    showDateIssue?: boolean;
    showDiscount?: boolean;
    showDueAmount?: boolean;
    showDueDate?: boolean;
    showInvoiceNumber?: boolean;
    showPaymentMade?: boolean;
    showStatement?: boolean;
    showSubtotal?: boolean;
    showTaxes?: boolean;
    showTermsConditions?: boolean;
    showTotal?: boolean;
    statementLabel?: string;
    subtotalLabel?: string;
    termsConditionsLabel?: string;
    totalLabel?: string;
  };
}

export function useGetSaleInvoiceBrandingTemplate(
  invoiceId: number,
  options?: UseQueryOptions<GetSaleInvoiceBrandingTemplateResponse, Error>
): UseQueryResult<GetSaleInvoiceBrandingTemplateResponse, Error> {
  const apiRequest = useApiRequest();

  return useQuery({
    queryKey: ['SALE_INVOICE_BRANDING_TEMPLATE', invoiceId],
    queryFn: () =>
      apiRequest
        .get(`/sale-invoices/${invoiceId}/template`, {})
        .then((res: { data?: { data?: unknown } }) =>
          transformToCamelCase(res.data?.data) as GetSaleInvoiceBrandingTemplateResponse
        ),
    ...options,
  });
}
