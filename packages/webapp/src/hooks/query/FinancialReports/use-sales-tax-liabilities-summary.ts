// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchSalesTaxLiabilitySummaryTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieves the sales tax liability summary report.
 */
export function useSalesTaxLiabilitySummary(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.SALES_TAX_LIABILITY_SUMMARY, query],
    queryFn: () => fetchSalesTaxLiabilitySummaryTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useSalesTaxLiabilitySummaryXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/sales-tax-liability-summary',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'sales_tax_liability_summary.xlsx',
    ...args,
  });
};

export const useSalesTaxLiabilitySummaryCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/sales-tax-liability-summary',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'sales_tax_liability_summary.csv',
    ...args,
  });
};

/**
 * Retrieves pdf document data of sales tax liability summary.
 */
export function useSalesTaxLiabilitySummaryPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/sales-tax-liability-summary`,
    params: query,
  });
}
