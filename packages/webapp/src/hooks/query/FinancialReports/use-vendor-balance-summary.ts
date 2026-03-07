// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchVendorBalanceSummaryTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve vendors balance summary report.
 */
export function useVendorsBalanceSummaryReport(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.VENDORS_BALANCE_SUMMARY, query],
    queryFn: () => fetchVendorBalanceSummaryTable(fetcher, query ?? {}),
    select: (data) => ({
      query: data?.query,
      table: data?.table,
      meta: data?.meta,
    }),
    placeholderData: defaultData ?? { table: {}, query: {}, meta: {} },
    ...rest,
  });
}

export const useVendorBalanceSummaryXlsxExport = (args) => {
  const url = '/reports/vendor-balance-summary';
  const config = {
    headers: {
      accept: 'application/xlsx',
    },
  };
  const filename = 'vendor_balance_summary.xlsx';

  return useDownloadFile({
    url,
    config,
    filename,
    ...args,
  });
};

export const useVendorBalanceSummaryCsvExport = (args) => {
  return useDownloadFile({
    url: '/reports/vendor-balance-summary',
    config: {
      headers: {
        accept: 'application/csv',
      },
    },
    filename: 'vendor_balance_summary.csv',
    ...args,
  });
};

export const useVendorBalanceSummaryPdfExport = (query = {}) => {
  return useRequestPdf({
    url: 'reports/vendor-balance-summary',
    params: query,
  });
};
