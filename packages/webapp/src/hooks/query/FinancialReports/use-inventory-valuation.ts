// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchInventoryValuationTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useRequestQuery } from '../../useQueryRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve inventory valuation.
 */
export function useInventoryValuation(query, props) {
  return useRequestQuery(
    [t.FINANCIAL_REPORT, t.INVENTORY_VALUATION, query],
    {
      method: 'get',
      url: '/reports/inventory-valuation',
      params: query,
    },
    {
      select: (res) => res.data,

      ...props,
    },
  );
}

/**
 * Retrieve inventory valuation (table format).
 */
export function useInventoryValuationTable(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.INVENTORY_VALUATION, query],
    queryFn: () => fetchInventoryValuationTable(fetcher, query ?? {}),
    ...props,
  });
}

export const useInventoryValuationXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/inventory-valuation',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'inventory_valuation.xlsx',
    ...args,
  });
};

export const useInventoryValuationCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/inventory-valuation',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'inventory_valuation.csv',
    ...args,
  });
};

/**
 * Retrieves the inventory valuation pdf document data.
 */
export function useInventoryValuationPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/inventory-valuation`,
    params: query,
  });
}
