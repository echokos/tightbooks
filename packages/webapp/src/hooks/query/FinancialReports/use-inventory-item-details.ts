// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchInventoryItemDetailsTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve inventory item detail report.
 */
export function useInventoryItemDetailsReport(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.INVENTORY_ITEM_DETAILS, query],
    queryFn: () => fetchInventoryItemDetailsTable(fetcher, query ?? {}),
    select: (data) => ({
      columns: data?.table?.columns,
      query: data?.query,
      meta: data?.meta,
      tableRows: data?.table?.rows,
    }),
    placeholderData: defaultData ?? {
      tableRows: [],
      columns: [],
      query: {},
      meta: {},
    },
    ...rest,
  });
}

export const useInventoryItemDetailsXlsxExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/inventory-item-details',
    config: {
      headers: {
        accept: 'application/xlsx',
      },
      params: query,
    },
    filename: 'inventory_item_details.xlsx',
    ...args,
  });
};

export const useInventoryItemDetailsCsvExport = (query, args) => {
  return useDownloadFile({
    url: '/reports/inventory-item-details',
    config: {
      headers: {
        accept: 'application/csv',
      },
      params: query,
    },
    filename: 'inventory_item_details.csv',
    ...args,
  });
};

/**
 * Retrieves the balance sheet pdf document data.
 */
export function useInventoryItemDetailsPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/inventory-item-details`,
    params: query,
  });
}
