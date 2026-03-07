// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchCashflowStatementTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import { useDownloadFile } from '../../useDownloadFile';
import { useRequestPdf } from '../../useRequestPdf';
import t from '../types';

/**
 * Retrieve cash flow statement report.
 */
export function useCashFlowStatementReport(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.FINANCIAL_REPORT, t.CASH_FLOW_STATEMENT, query],
    queryFn: () => fetchCashflowStatementTable(fetcher, query ?? {}),
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

export const useCashFlowStatementXlsxExport = (query, args) => {
  const url = '/reports/cashflow-statement';
  const config = {
    headers: {
      accept: 'application/xlsx',
    },
    params: query,
  };
  const filename = 'cashflow_statement.xlsx';

  return useDownloadFile({
    url,
    config,
    filename,
    ...args,
  });
};

export const useCashFlowStatementCsvExport = (query, args) => {
  const url = '/reports/cashflow-statement';
  const config = {
    headers: {
      accept: 'application/csv',
    },
    params: query,
  };
  const filename = 'cashflow_statement.csv';

  return useDownloadFile({
    url,
    config,
    filename,
    ...args,
  });
};

/**
 * Retrieves the cashflow sheet pdf document.
 */
export function useCashflowSheetPdf(query = {}) {
  return useRequestPdf({
    url: `/reports/cashflow-statement`,
    params: query,
  });
}
