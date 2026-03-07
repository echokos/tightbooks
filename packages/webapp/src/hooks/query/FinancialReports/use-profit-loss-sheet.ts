// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchProfitLossSheetTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve profit/loss (P&L) sheet.
 */
export function useProfitLossSheet(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.PROFIT_LOSS_SHEET, query],
    queryFn: () => fetchProfitLossSheetTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useProfitLossSheetXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/profit-loss-sheet',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'profit_loss_sheet.xlsx',
    ...args,
  });
};

export const useProfitLossSheetCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/profit-loss-sheet',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'profit_loss_sheet.csv',
    ...args,
  });
};

/**
 * Retrieves the profit/loss sheet pdf document data.
 */
export function useProfitLossSheetPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/profit-loss-sheet`,
    params: query,
  });
}
