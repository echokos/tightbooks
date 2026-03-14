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
import useApiRequest, { useApiFetcher } from '../../useRequest';
import { transformToCamelCase } from '@/utils';
import { useRequestPdf } from '../../useRequestPdf';
import { useRequestQuery } from '../../useQueryRequest';
import { receiptsKeys, ReceiptsQueryKeys } from './query-keys';
import { itemsKeys } from '../items/query-keys';
import { accountsKeys } from '../accounts/query-keys';

// Keys that don't have factory methods yet - keeping inline
const FINANCIAL_REPORT = 'FINANCIAL-REPORT';
const TRANSACTIONS_BY_REFERENCE = 'TRANSACTIONS_BY_REFERENCE';
const CASH_FLOW_TRANSACTIONS = 'CASH_FLOW_TRANSACTIONS';
const CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY = 'CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY';
const ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES = 'ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES';
const SETTING = 'SETTING';
const SETTING_RECEIPTS = 'SETTING_RECEIPTS';

function commonInvalidateQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: receiptsKeys.all() });
  queryClient.invalidateQueries({ queryKey: itemsKeys.all() });
  queryClient.invalidateQueries({ queryKey: accountsKeys.all() });
  queryClient.invalidateQueries({ queryKey: [FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_BY_REFERENCE] });
  queryClient.invalidateQueries({ queryKey: [CASH_FLOW_TRANSACTIONS] });
  queryClient.invalidateQueries({ queryKey: [CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  queryClient.invalidateQueries({ queryKey: itemsKeys.associatedReceipts(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: itemsKeys.warehousesLocation(null).slice(0, 1) });
  queryClient.invalidateQueries({ queryKey: [SETTING, SETTING_RECEIPTS] });
  queryClient.invalidateQueries({ queryKey: [ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
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
    ...props,
    mutationFn: (values: CreateSaleReceiptBody) => createSaleReceipt(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    mutationFn: ([id, values]: [number, EditSaleReceiptBody]) =>
      editSaleReceipt(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: receiptsKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Deletes the given sale receipt.
 */
export function useDeleteReceipt(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteSaleReceipt(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: receiptsKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
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
    ...props,
    mutationFn: ({ ids, skipUndeletable = false }: { ids: number[]; skipUndeletable?: boolean }) =>
      bulkDeleteSaleReceipts(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
  });
}

export function useValidateBulkDeleteReceipts(
  props?: UseMutationOptions<ValidateBulkDeleteReceiptsResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (ids: number[]) => validateBulkDeleteSaleReceipts(fetcher, ids),
  });
}

/**
 * Closes the given sale receipt.
 */
export function useCloseReceipt(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => closeSaleReceipt(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: receiptsKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Retrieve sale receipts list with pagination meta.
 */
export function useReceipts(
  query?: Record<string, unknown>,
  props?: UseQueryOptions<SaleReceiptsListResponse, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: receiptsKeys.list(query),
    queryFn: () => fetchSaleReceipts(fetcher, query),
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
    ...props,
    queryKey: receiptsKeys.detail(id),
    queryFn: () => fetchSaleReceipt(fetcher, id as number),
    enabled: id != null,
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
      queryClient.invalidateQueries({ queryKey: receiptsKeys.all() });
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
    ...props,
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.post(`sale-receipts/${id}/notify-by-sms`, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [ReceiptsQueryKeys.NOTIFY_SALE_RECEIPT_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
  });
}

// Not in OpenAPI schema for sale-receipts; keep using useRequestQuery.
export function useReceiptSMSDetail(
  receiptId: number,
  props?: Record<string, unknown>,
  requestProps?: Record<string, unknown>
) {
  return useRequestQuery(
    receiptsKeys.smsDetail(receiptId),
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
    ...props,
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      sendSaleReceiptMail(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    queryKey: [ReceiptsQueryKeys.SALE_RECEIPT_MAIL_OPTIONS, receiptId],
    queryFn: () =>
      fetchSaleReceiptMail(fetcher, receiptId).then((data) =>
        transformToCamelCase(data) as GetSaleReceiptMailStateResponse
      ),
  });
}

export type IGetReceiptStateResponse = SaleReceiptStateResponse;

export function useGetReceiptState(
  options?: UseQueryOptions<IGetReceiptStateResponse, Error>
): UseQueryResult<IGetReceiptStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: ['SALE_RECEIPT_STATE'],
    queryFn: () => fetchSaleReceiptState(fetcher).then((data) => transformToCamelCase(data) as IGetReceiptStateResponse),
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
    ...options,
    queryKey: ['SALE_RECEIPT_HTML', receiptId],
    queryFn: () =>
      apiRequest
        .get(`sale-receipts/${receiptId}`, {
          headers: { Accept: 'application/json+html' },
        })
        .then((res) => transformToCamelCase(res.data) as GetReceiptHtmlResponse),
  });
}
