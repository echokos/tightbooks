import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import useApiRequest from '../../useRequest';
import { useApiFetcher } from '../../useRequest';
import { downloadFile } from '../../useDownloadFile';
import { importKeys } from './query-keys';
import { BANK_QUERY_KEY } from '@/constants/query-keys/banking';
import type {
  ImportMappingBody,
  ImportPreviewResponse,
  ImportFileMetaResponse,
  ImportProcessResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchImportPreview,
  fetchImportFileMeta,
  importMapping,
  importProcess,
} from '@bigcapital/sdk-ts';

/**
 * Upload import file (multipart/form-data). Uses apiRequest because SDK does not support FormData.
 */
export function useImportFileUpload(props = {}) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    ...props,
    mutationFn: (values: FormData | Record<string, unknown>) =>
      apiRequest.post(`import/file`, values),
    onSuccess: () => {},
  });
}

export function useImportFileMapping(
  props?: UseMutationOptions<void, Error, [string, ImportMappingBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([importId, values]: [string, ImportMappingBody]) =>
      importMapping(fetcher, importId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [importKeys.preview('').slice(0, 1)] });
      queryClient.invalidateQueries({ queryKey: [importKeys.fileMeta('').slice(0, 1)] });
    },
  });
}

export function useImportFilePreview(
  importId: string,
  props?: UseQueryOptions<ImportPreviewResponse, Error, unknown>
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...props,
    queryKey: importKeys.preview(importId),
    queryFn: () => fetchImportPreview(fetcher, importId),
    enabled: !!importId,
  });
}

export function useImportFileMeta(
  importId: string,
  props?: UseQueryOptions<ImportFileMetaResponse, Error, unknown>
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...props,
    queryKey: importKeys.fileMeta(importId),
    queryFn: () => fetchImportFileMeta(fetcher, importId),
    enabled: !!importId,
  });
}

export function useImportFileProcess(
  props?: UseMutationOptions<ImportProcessResponse, Error, string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (importId: string) => importProcess(fetcher, importId),
    onSuccess: (_data, _importId) => {
      if (_data?.resource) {
        invalidateResourcesOnImport(queryClient, _data.resource);
      }
    },
  });
}

export interface SampleSheetImportQuery {
  resource: string;
  filename: string;
  format: 'xlsx' | 'csv';
}

/**
 * Download import sample sheet (blob). Uses apiRequest for blob response.
 */
export const useSampleSheetImport = () => {
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: (data: SampleSheetImportQuery) =>
      apiRequest
        .get('/import/sample', {
          responseType: 'blob',
          headers: {
            accept:
              data.format === 'xlsx' ? 'application/xlsx' : 'application/csv',
          },
          params: {
            resource: data.resource,
            format: data.format,
          },
        })
        .then((res) => {
          downloadFile(res.data, `${data.filename}.${data.format}`);
          return res;
        }),
  });
};

/**
 * Invalidates resources cached queries based on the given resource name.
 */
const invalidateResourcesOnImport = (
  queryClient: QueryClient,
  resource: string,
) => {
  switch (resource) {
    case 'Item':
      queryClient.invalidateQueries({ queryKey: ['ITEMS'] });
      queryClient.invalidateQueries({ queryKey: ['ITEM'] });
      break;

    case 'ItemCategory':
      queryClient.invalidateQueries({ queryKey: ['ITEMS_CATEGORIES'] });
      break;

    case 'Bill':
      queryClient.invalidateQueries({ queryKey: ['BILLS'] });
      queryClient.invalidateQueries({ queryKey: ['BILL'] });
      queryClient.invalidateQueries({ queryKey: ['ITEMS_ASSOCIATED_WITH_BILLS'] });
      break;

    case 'SaleInvoice':
      queryClient.invalidateQueries({ queryKey: ['SALE_INVOICE'] });
      queryClient.invalidateQueries({ queryKey: ['SALE_INVOICES'] });
      queryClient.invalidateQueries({ queryKey: ['ITEM_ASSOCIATED_WITH_INVOICES'] });
      break;

    case 'SaleEstimate':
      queryClient.invalidateQueries({ queryKey: ['SALE_ESTIMATE'] });
      queryClient.invalidateQueries({ queryKey: ['SALE_ESTIMATES'] });
      queryClient.invalidateQueries({ queryKey: ['ITEM_ASSOCIATED_WITH_ESTIMATES'] });
      break;

    case 'SaleReceipt':
      queryClient.invalidateQueries({ queryKey: ['SALE_RECEIPT'] });
      queryClient.invalidateQueries({ queryKey: ['SALE_RECEIPTS'] });
      queryClient.invalidateQueries({ queryKey: ['ITEM_ASSOCIATED_WITH_RECEIPTS'] });
      break;

    case 'CreditNote':
      queryClient.invalidateQueries({ queryKey: ['CREDIT_NOTE'] });
      queryClient.invalidateQueries({ queryKey: ['CREDIT_NOTES'] });
      break;

    case 'VendorCredit':
      queryClient.invalidateQueries({ queryKey: ['VENDOR_CREDIT'] });
      queryClient.invalidateQueries({ queryKey: ['VENDOR_CREDITS'] });
      break;

    case 'PaymentReceive':
      queryClient.invalidateQueries({ queryKey: ['PAYMENT_RECEIVE'] });
      queryClient.invalidateQueries({ queryKey: ['PAYMENT_RECEIVES'] });
      break;

    case 'BillPayment':
      queryClient.invalidateQueries({ queryKey: ['BILLS_PAYMENT_TRANSACTIONS'] });
      break;

    case 'Customer':
      queryClient.invalidateQueries({ queryKey: ['CUSTOMERS'] });
      queryClient.invalidateQueries({ queryKey: ['CUSTOMER'] });
      break;

    case 'Vendor':
      queryClient.invalidateQueries({ queryKey: ['VENDOR'] });
      queryClient.invalidateQueries({ queryKey: ['VENDORS'] });
      break;

    case 'Expense':
      queryClient.invalidateQueries({ queryKey: ['EXPENSE'] });
      queryClient.invalidateQueries({ queryKey: ['EXPENSES'] });
      break;

    case 'ManualJournal':
      queryClient.invalidateQueries({ queryKey: ['MANUAL_JOURNAL'] });
      queryClient.invalidateQueries({ queryKey: ['MANUAL_JOURNALS'] });
      break;

    case 'UncategorizedBankTransaction':
      queryClient.invalidateQueries({ queryKey: ['CASH_FLOW_TRANSACTIONS'] });
      queryClient.invalidateQueries({ queryKey: ['CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY'] });
      queryClient.invalidateQueries({ queryKey: ['CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY'] });
      queryClient.invalidateQueries({ queryKey: ['CASHFLOW_UNCAATEGORIZED_TRANSACTION'] });
      queryClient.invalidateQueries({ queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META] });
      break;
  }
};
