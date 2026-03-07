// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchReceivableAgingSummaryTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve A/R aging summary report.
 */
export function useARAgingSummaryReport(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.AR_AGING_SUMMARY, query],
    queryFn: () => fetchReceivableAgingSummaryTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useARAgingSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/receivable-aging-summary',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'receivable_aging_summary.xlsx',
    ...args,
  });
};

export const useARAgingSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/receivable-aging-summary',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'receivable_aging_summary.csv',
    ...args,
  });
};

/**
 * Retrieves the A/R aging summary pdf document data.
 */
export function useARAgingSummaryPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/receivable_aging_summary`,
    params: query,
  });
}
