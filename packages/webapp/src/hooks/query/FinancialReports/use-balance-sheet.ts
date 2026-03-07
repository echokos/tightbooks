// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchBalanceSheetTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Fetches balance sheet data.
 * @param {Object} query - The query parameters for the request.
 * @param {Object} props - Additional options for the request.
 * @returns {Object} The response object from the useQuery hook.
 */
export function useBalanceSheet(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.BALANCE_SHEET, query],
    queryFn: () => fetchBalanceSheetTable(fetcher, query ?? {}),
    ...props,
  });
}

/**
 * Initiates a download of the balance sheet in XLSX format.
 * @param {Object} query - The query parameters for the request.
 * @param {Object} args - Additional configurations for the download.
 * @returns {Function} A function to trigger the file download.
 */
export const useBalanceSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/balance-sheet',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'balance_sheet.xlsx',
    ...args,
  });
};

/**
 * Initiates a download of the balance sheet in CSV format.
 * @param {Object} query - The query parameters for the request.
 * @param {Object} args - Additional configurations for the download.
 * @returns {Function} A function to trigger the file download.
 */
export const useBalanceSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/balance-sheet',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'balance_sheet.csv',
    ...args,
  });
};

/**
 * Fetches balance sheet data in PDF format.
 * @param {Object} [query={}] - The query parameters for the request.
 * @returns {Object} The response object from the useRequestPdf hook.
 */
export function useBalanceSheetPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/balance-sheet`,
    params: query,
  });
}
