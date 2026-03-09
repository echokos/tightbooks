import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import useApiRequest from '../useRequest';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import { downloadFile } from '../useDownloadFile';
import T from './types';
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

const QueryKeys = {
  ImportPreview: 'ImportPreview',
  ImportFileMeta: 'ImportFileMeta',
};

/**
 * Upload import file (multipart/form-data). Uses apiRequest because SDK does not support FormData.
 */
export function useImportFileUpload(props = {}) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: (values: FormData | Record<string, unknown>) =>
      apiRequest.post(`import/file`, values),
    onSuccess: () => {},
    ...props,
  });
}

export function useImportFileMapping(
  props?: UseMutationOptions<void, Error, [string, ImportMappingBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([importId, values]: [string, ImportMappingBody]) =>
      importMapping(fetcher, importId, values),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.ImportPreview]);
      queryClient.invalidateQueries([QueryKeys.ImportFileMeta]);
    },
    ...props,
  });
}

export function useImportFilePreview(
  importId: string,
  props?: UseQueryOptions<ImportPreviewResponse, Error, unknown>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [QueryKeys.ImportPreview, importId],
    queryFn: () => fetchImportPreview(fetcher, importId),
    select: (data) => transformToCamelCase(data),
    enabled: !!importId,
    ...props,
  });
}

export function useImportFileMeta(
  importId: string,
  props?: UseQueryOptions<ImportFileMetaResponse, Error, unknown>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [QueryKeys.ImportFileMeta, importId],
    queryFn: () => fetchImportFileMeta(fetcher, importId),
    select: (data) => transformToCamelCase(data),
    enabled: !!importId,
    ...props,
  });
}

export function useImportFileProcess(
  props?: UseMutationOptions<ImportProcessResponse, Error, string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (importId: string) => importProcess(fetcher, importId),
    onSuccess: (_data, _importId) => {
      if (_data?.resource) {
        invalidateResourcesOnImport(queryClient, _data.resource);
      }
    },
    ...props,
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
      queryClient.invalidateQueries(T.ITEMS);
      queryClient.invalidateQueries(T.ITEM);
      break;

    case 'ItemCategory':
      queryClient.invalidateQueries(T.ITEMS_CATEGORIES);
      break;

    case 'Bill':
      queryClient.invalidateQueries(T.BILLS);
      queryClient.invalidateQueries(T.BILL);
      queryClient.invalidateQueries(T.ITEMS_ASSOCIATED_WITH_BILLS);
      break;

    case 'SaleInvoice':
      queryClient.invalidateQueries(T.SALE_INVOICE);
      queryClient.invalidateQueries(T.SALE_INVOICES);
      queryClient.invalidateQueries(T.ITEM_ASSOCIATED_WITH_INVOICES);
      break;

    case 'SaleEstimate':
      queryClient.invalidateQueries(T.SALE_ESTIMATE);
      queryClient.invalidateQueries(T.SALE_ESTIMATES);
      queryClient.invalidateQueries(T.ITEM_ASSOCIATED_WITH_ESTIMATES);
      break;

    case 'SaleReceipt':
      queryClient.invalidateQueries(T.SALE_RECEIPT);
      queryClient.invalidateQueries(T.SALE_RECEIPTS);
      queryClient.invalidateQueries(T.ITEM_ASSOCIATED_WITH_RECEIPTS);
      break;

    case 'CreditNote':
      queryClient.invalidateQueries(T.CREDIT_NOTE);
      queryClient.invalidateQueries(T.CREDIT_NOTES);
      break;

    case 'VendorCredit':
      queryClient.invalidateQueries(T.VENDOR_CREDIT);
      queryClient.invalidateQueries(T.VENDOR_CREDITS);
      break;

    case 'PaymentReceive':
      queryClient.invalidateQueries(T.PAYMENT_RECEIVE);
      queryClient.invalidateQueries(T.PAYMENT_RECEIVES);
      break;

    case 'BillPayment':
      queryClient.invalidateQueries(T.BILLS_PAYMENT_TRANSACTIONS);
      break;

    case 'Customer':
      queryClient.invalidateQueries(T.CUSTOMERS);
      queryClient.invalidateQueries(T.CUSTOMER);
      break;

    case 'Vendor':
      queryClient.invalidateQueries(T.VENDOR);
      queryClient.invalidateQueries(T.VENDORS);
      break;

    case 'Expense':
      queryClient.invalidateQueries(T.EXPENSE);
      queryClient.invalidateQueries(T.EXPENSES);
      break;

    case 'ManualJournal':
      queryClient.invalidateQueries(T.MANUAL_JOURNAL);
      queryClient.invalidateQueries(T.MANUAL_JOURNALS);
      break;

    case 'UncategorizedBankTransaction':
      queryClient.invalidateQueries(T.CASH_FLOW_TRANSACTIONS);
      queryClient.invalidateQueries(T.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY);
      queryClient.invalidateQueries(
        T.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY,
      );
      queryClient.invalidateQueries(T.CASHFLOW_UNCAATEGORIZED_TRANSACTION);
      queryClient.invalidateQueries(BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META);
      break;
  }
};
