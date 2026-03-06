import {
  useQueryClient,
  useMutation,
  useQuery,
  UseQueryResult,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import type {
  SaleReceiptsListResponse,
  SaleReceipt,
  CreateSaleReceiptBody,
  EditSaleReceiptBody,
  ValidateBulkDeleteReceiptsResponse,
  SaleReceiptStateResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchSaleReceipts,
  fetchSaleReceipt,
  createSaleReceipt,
  editSaleReceipt,
  deleteSaleReceipt,
  bulkDeleteSaleReceipts,
  validateBulkDeleteSaleReceipts,
  closeSaleReceipt,
  fetchSaleReceiptMail,
  sendSaleReceiptMail,
  fetchSaleReceiptState,
} from '@bigcapital/sdk-ts';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { transformPagination, transformToCamelCase } from '@/utils';
import { useRequestPdf } from '../useRequestPdf';
import { useRequestQuery } from '../useQueryRequest';
import t from './types';

function commonInvalidateQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPTS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_ASSOCIATED_WITH_RECEIPTS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_WAREHOUSES_LOCATION] });
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_RECEIPTS] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
}

/**
 * Creates a new sale receipt.
 */
export function useCreateReceipt(
  props?: UseMutationOptions<void, Error, CreateSaleReceiptBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateSaleReceiptBody) => createSaleReceipt(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edits the given sale receipt.
 */
export function useEditReceipt(
  props?: UseMutationOptions<void, Error, [number, EditSaleReceiptBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditSaleReceiptBody]) =>
      editSaleReceipt(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given sale receipt.
 */
export function useDeleteReceipt(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteSaleReceipt(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes multiple receipts in bulk.
 */
export function useBulkDeleteReceipts(
  props?: UseMutationOptions<
    void,
    Error,
    { ids: number[]; skipUndeletable?: boolean }
  >
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({ ids, skipUndeletable = false }: { ids: number[]; skipUndeletable?: boolean }) =>
      bulkDeleteSaleReceipts(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteReceipts(
  props?: UseMutationOptions<ValidateBulkDeleteReceiptsResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) => validateBulkDeleteSaleReceipts(fetcher, ids),
    ...props,
  });
}

/**
 * Closes the given sale receipt.
 */
export function useCloseReceipt(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => closeSaleReceipt(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

function transformReceiptsList(res: SaleReceiptsListResponse) {
  const data = res as {
    data?: unknown[];
    pagination?: unknown;
    filter_meta?: Record<string, unknown>;
  };
  return {
    receipts: data?.data ?? [],
    pagination: transformPagination(data?.pagination ?? {}),
    filterMeta: data?.filter_meta ?? {},
  };
}

/**
 * Retrieve sale receipts list with pagination meta.
 */
export function useReceipts(
  query?: Record<string, unknown>,
  props?: UseQueryOptions<
    {
      receipts: unknown[];
      pagination: ReturnType<typeof transformPagination>;
      filterMeta: Record<string, unknown>;
    },
    Error
  >
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_RECEIPTS, query],
    queryFn: () => fetchSaleReceipts(fetcher, query).then(transformReceiptsList),
    ...props,
  });
}

/**
 * Retrieve sale receipt detail.
 */
export function useReceipt(
  id: number | null | undefined,
  props?: UseQueryOptions<SaleReceipt, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_RECEIPT, id],
    queryFn: () => fetchSaleReceipt(fetcher, id as number),
    enabled: id != null,
    ...props,
  });
}

/**
 * Retrieve the receipt pdf document data.
 */
export function usePdfReceipt(receiptId: number) {
  return useRequestPdf({ url: `sale-receipts/${receiptId}` });
}

export function useRefreshReceipts() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPTS] });
    },
  };
}

// Not in OpenAPI schema for sale-receipts; keep using apiRequest until server exposes.
export function useCreateNotifyReceiptBySMS(
  props?: UseMutationOptions<unknown, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.post(`sale-receipts/${id}/notify-by-sms`, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.NOTIFY_SALE_RECEIPT_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

// Not in OpenAPI schema for sale-receipts; keep using useRequestQuery.
export function useReceiptSMSDetail(
  receiptId: number,
  props?: Record<string, unknown>,
  requestProps?: Record<string, unknown>
) {
  return useRequestQuery(
    [t.SALE_RECEIPT_SMS_DETAIL, receiptId],
    {
      method: 'get',
      url: `sale-receipts/${receiptId}/sms-details`,
      ...requestProps,
    },
    {
      select: (res: { data: unknown }) => res.data,
      defaultData: {},
      ...props,
    }
  );
}

/**
 * Sends the sale receipt mail.
 */
export function useSendSaleReceiptMail(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      sendSaleReceiptMail(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export interface GetSaleReceiptMailStateResponse {
  attachReceipt: boolean;
  closedAtDate: string;
  closedAtDateFormatted: string;
  companyName: string;
  customerName: string;
  formatArgs: Record<string, unknown>;
  from: string[];
  fromOptions: Array<{ mail: string; label: string; primary: boolean }>;
  message: string;
  receiptDate: string;
  receiptDateFormatted: string;
  subject: string;
  subtotal: number;
  subtotalFormatted: string;
  to: string[];
  toOptions: Array<{ mail: string; label: string; primary: boolean }>;
  discountAmount: number;
  discountAmountFormatted: string;
  discountLabel: string;
  discountPercentage: number | null;
  discountPercentageFormatted: string;
  adjustment: number;
  adjustmentFormatted: string;
  total: number;
  totalFormatted: string;
  companyLogoUri?: string | null;
  primaryColor?: string | null;
  entries: Array<{
    name: string;
    quantity: number;
    quantityFormatted: string;
    rate: number;
    rateFormatted: string;
    total: number;
    totalFormatted: string;
  }>;
  receiptNumber: string;
}

export function useSaleReceiptMailState(
  receiptId: number,
  props?: UseQueryOptions<GetSaleReceiptMailStateResponse, Error>
): UseQueryResult<GetSaleReceiptMailStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.SALE_RECEIPT_MAIL_OPTIONS, receiptId],
    queryFn: () =>
      fetchSaleReceiptMail(fetcher, receiptId).then((data) =>
        transformToCamelCase(data) as GetSaleReceiptMailStateResponse
      ),
    ...props,
  });
}

export type IGetReceiptStateResponse = SaleReceiptStateResponse;

export function useGetReceiptState(
  options?: UseQueryOptions<IGetReceiptStateResponse, Error>
): UseQueryResult<IGetReceiptStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['SALE_RECEIPT_STATE'],
    queryFn: () => fetchSaleReceiptState(fetcher).then((data) => transformToCamelCase(data) as IGetReceiptStateResponse),
    ...options,
  });
}

interface GetReceiptHtmlResponse {
  htmlContent: string;
}

/**
 * Retrieves the sale receipt html content (custom Accept header; not in SDK).
 */
export function useGetSaleReceiptHtml(
  receiptId: number,
  options?: UseQueryOptions<GetReceiptHtmlResponse, Error>
): UseQueryResult<GetReceiptHtmlResponse, Error> {
  const apiRequest = useApiRequest();

  return useQuery({
    queryKey: ['SALE_RECEIPT_HTML', receiptId],
    queryFn: () =>
      apiRequest
        .get(`sale-receipts/${receiptId}`, {
          headers: { Accept: 'application/json+html' },
        })
        .then((res) => transformToCamelCase(res.data) as GetReceiptHtmlResponse),
    ...options,
  });
}
