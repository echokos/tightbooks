// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionsByCustomersTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve customers transactions report.
 */
export function useCustomersTransactionsReport(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.CUSTOMERS_TRANSACTIONS, query],
    queryFn: () => fetchTransactionsByCustomersTable(fetcher, query ?? {}),
    select: (data) => ({
      data: data?.table,
      tableRows: data?.table?.rows,
      meta: data?.meta,
    }),
    placeholderData: defaultData ?? { tableRows: [], data: [], meta: {} },
    ...rest,
  });
}

export const useCustomersTransactionsXlsxExport = (query, args) => {
  const url = '/reports/transactions-by-customers';
  const config = {
    headers: {
      accept: 'application/xlsx',
    },
    params: query,
  };
  const filename = 'customers_transactions.xlsx';

  return useDownloadFile({
    url,
    config,
    filename,
    ...args,
  });
};

export const useCustomersTransactionsCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/transactions-by-customers',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'customers_transactions.csv',
    ...args,
  });
};

/**
 * Retrieves the pdf content of customers transactions.
 */
export const useCustomersTransactionsPdfExport = (query = {}) => {
  return useRequestPdf({
    url: '/reports/transactions-by-customers',
    params: query,
  });
};
