// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchGeneralLedgerTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve general ledger (GL) sheet.
 */
export function useGeneralLedgerSheet(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.GENERAL_LEDGER, query],
    queryFn: () => fetchGeneralLedgerTable(fetcher, query ?? {}),
    ...props,
  });
}
export const useGeneralLedgerSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/general-ledger',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'general_ledger.xlsx',
    ...args,
  });
};

export const useGeneralLedgerSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/general-ledger',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'general_ledger.csv',
    ...args,
  });
};

/**
 * Retrieves the general ledger pdf document data.
 */
export function useGeneralLedgerPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/general-ledger`,
    params: query,
  });
}
