// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchPayableAgingSummaryTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve A/P aging summary report.
 */
export function useAPAgingSummaryReport(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.AP_AGING_SUMMARY, query],
    queryFn: () => fetchPayableAgingSummaryTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useAPAgingSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/payable-aging-summary',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'payable_aging_summary.xlsx',
    ...args,
  });
};

export const useAPAgingSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/payable-aging-summary',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'payable_aging_summary.csv',
    ...args,
  });
};

/**
 * Retrieves the A/P aging summary pdf document.
 */
export function useAPAgingSummaryPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/payable-aging-summary`,
    params: query,
  });
}
