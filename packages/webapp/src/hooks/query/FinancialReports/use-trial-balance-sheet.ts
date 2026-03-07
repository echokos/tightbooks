// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchTrialBalanceSheetTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve trial balance sheet.
 */
export function useTrialBalanceSheet(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.TRIAL_BALANCE_SHEET, query],
    queryFn: () => fetchTrialBalanceSheetTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useTrialBalanceSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/trial-balance-sheet',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'trial_balance_sheet.xlsx',
    ...args,
  });
};

export const useTrialBalanceSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/trial-balance-sheet',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'trial_balance_sheet.csv',
    ...args,
  });
};

/**
 * Retrieves the trial balance sheet pdf document data.
 */
export function useTrialBalanceSheetPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/trial-balance-sheet`,
    params: query,
  });
}
