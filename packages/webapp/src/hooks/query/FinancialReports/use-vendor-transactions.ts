// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionsByVendorsTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve vendors transactions report.
 */
export function useVendorsTransactionsReport(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.VENDORS_TRANSACTIONS, query],
    queryFn: () => fetchTransactionsByVendorsTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useVendorsTransactionsXlsxExport = (query, args) => {
  const url = '/reports/transactions-by-vendors';
  const config = {
    headers: {
      accept: 'application/xlsx',
    },
    params: query,
  };
  const filename = 'transactions_by_vendor.xlsx';

  return useDownloadFile({
    url,
    config,
    filename,
    ...args,
  });
};

export const useVendorsTransactionsCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/transactions-by-vendors',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'transactions_by_vendor.csv',
    ...args,
  });
};
/**
 * Retrieves pdf document data of the transactions by vendor sheet.
 */
export function useTransactionsByVendorsPdf(query = {}) {
  return useRequestPdf({
    url: `financial_statements/transactions-by-vendors`,
    params: query,
  });
}
