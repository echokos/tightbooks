// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchJournalTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve journal sheet.
 */
export function useJournalSheet(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.JOURNAL, query],
    queryFn: () => fetchJournalTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useJournalSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/journal',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'journal.xlsx',
    ...args,
  });
};

export const useJournalSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/journal',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'journal.csv',
    ...args,
  });
};

/**
 * Retrieves the journal sheet pdf content.
 */
export const useJournalSheetPdf = (query = {}) => {
  return useRequestPdf({
    url: `/reports/journal`,
    params: query,
  });
};
