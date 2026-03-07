// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchPurchasesByItemsTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useRequestQuery } from '../../useQueryRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve purchases by items.
 */
export function usePurchasesByItems(query, props) {
  return useRequestQuery(
    [t.FINANCIAL_REPORT, t.PURCHASES_BY_ITEMS, query],
    {
      method: 'get',
      url: '/reports/purchases-by-items',
      params: query,
    },
    {
      select: (res) => res.data,
      ...props,
    },
  );
}

export function usePurchasesByItemsTable(query, props) {
  const fetcher = useReportsApiFetcher();
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.PURCHASES_BY_ITEMS, query],
    queryFn: () => fetchPurchasesByItemsTable(fetcher, query ?? {}),
    ...props,
  });
}

export const usePurchasesByItemsCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/purchases-by-items',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'purchases_by_items.csv',
    ...args,
  });
};

export const usePurchasesByItemsXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/purchases-by-items',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'purchases_by_items.xlsx',
    ...args,
  });
};

/**
 * Retrieves the pdf document of purchases by items.
 */
export const usePurchasesByItemsPdfExport = (query = {}) => {
  return useRequestPdf({
    url: '/reports/purchases-by-items',
    params: query,
  });
};
