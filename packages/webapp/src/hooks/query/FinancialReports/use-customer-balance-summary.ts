// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchCustomerBalanceSummaryTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve customers balance summary report.
 */
export function useCustomerBalanceSummaryReport(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.CUSTOMERS_BALANCE_SUMMARY, query],
    queryFn: () => fetchCustomerBalanceSummaryTable(fetcher, query ?? {}),
    select: (data) => ({
      query: data?.query,
      table: data?.table,
      meta: data?.meta,
    }),
    placeholderData: defaultData ?? { table: {}, query: {}, meta: {} },
    ...rest,
  });
}

export const useCustomerBalanceSummaryXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/customer-balance-summary',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'customer_balance_summary.xlsx',
    ...args,
  });
};

export const useCustomerBalanceSummaryCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/customer-balance-summary',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'customer_balance_summary.csv',
    ...args,
  });
};

/**
 * Retrieves the pdf content of customers balance summary.
 */
export function useCustomerBalanceSummaryPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/customer-balance-summary`,
    params: query,
  });
}
