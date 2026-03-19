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
  SaleReceiptMailResponse,
  SaleReceiptSendMailBody,
  SaleReceiptHtmlContentResponse,
  GetSaleReceiptsQuery,
  BulkDeleteReceiptsBody,
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
  fetchSaleReceiptHtmlContent,
} from '@bigcapital/sdk-ts';
import useApiRequest, { useApiFetcher } from '../../useRequest';
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

export function useBulkDeleteReceipts(
  props?: UseMutationOptions<void, Error, BulkDeleteReceiptsBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ({ ids, skipUndeletable = false }: BulkDeleteReceiptsBody) =>
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

export function useReceipts(
  query?: GetSaleReceiptsQuery,
  props?: UseQueryOptions<SaleReceiptsListResponse, Error>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: receiptsKeys.list(query),
    queryFn: () => fetchSaleReceipts(fetcher, query),
  });
}

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
      defaultData: {},
      ...props,
    }
  );
}

export function useSendSaleReceiptMail(
  props?: UseMutationOptions<void, Error, [number, SaleReceiptSendMailBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, SaleReceiptSendMailBody]) =>
      sendSaleReceiptMail(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
  });
}

export function useSaleReceiptMailState(
  receiptId: number,
  props?: UseQueryOptions<SaleReceiptMailResponse, Error>
): UseQueryResult<SaleReceiptMailResponse, Error> {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...props,
    queryKey: [ReceiptsQueryKeys.SALE_RECEIPT_MAIL_OPTIONS, receiptId],
    queryFn: () => fetchSaleReceiptMail(fetcher, receiptId),
  });
}

export function useGetReceiptState(
  options?: UseQueryOptions<SaleReceiptStateResponse, Error>
): UseQueryResult<SaleReceiptStateResponse, Error> {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...options,
    queryKey: ['SALE_RECEIPT_STATE'],
    queryFn: () => fetchSaleReceiptState(fetcher),
  });
}

export function useGetSaleReceiptHtml(
  receiptId: number,
  options?: UseQueryOptions<SaleReceiptHtmlContentResponse, Error>
): UseQueryResult<SaleReceiptHtmlContentResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: ['SALE_RECEIPT_HTML', receiptId],
    queryFn: () => fetchSaleReceiptHtmlContent(fetcher, receiptId),
  });
}
