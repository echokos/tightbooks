import type { OpArgType } from 'openapi-typescript-fetch';
import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpQueryParams, OpResponseBodyTable } from './utils';

export const REPORTS_ROUTES = {
  BALANCE_SHEET: '/api/reports/balance-sheet',
  PURCHASES_BY_ITEMS: '/api/reports/purchases-by-items',
  CUSTOMER_BALANCE_SUMMARY: '/api/reports/customer-balance-summary',
  VENDOR_BALANCE_SUMMARY: '/api/reports/vendor-balance-summary',
  SALES_BY_ITEMS: '/api/reports/sales-by-items',
  GENERAL_LEDGER: '/api/reports/general-ledger',
  TRIAL_BALANCE_SHEET: '/api/reports/trial-balance-sheet',
  TRANSACTIONS_BY_VENDORS: '/api/reports/transactions-by-vendors',
  TRANSACTIONS_BY_CUSTOMERS: '/api/reports/transactions-by-customers',
  TRANSACTIONS_BY_REFERENCE: '/api/reports/transactions-by-reference',
  RECEIVABLE_AGING_SUMMARY: '/api/reports/receivable-aging-summary',
  PAYABLE_AGING_SUMMARY: '/api/reports/payable-aging-summary',
  INVENTORY_ITEM_DETAILS: '/api/reports/inventory-item-details',
  INVENTORY_VALUATION: '/api/reports/inventory-valuation',
  SALES_TAX_LIABILITY_SUMMARY: '/api/reports/sales-tax-liability-summary',
  JOURNAL: '/api/reports/journal',
  PROFIT_LOSS_SHEET: '/api/reports/profit-loss-sheet',
  CASHFLOW_STATEMENT: '/api/reports/cashflow-statement',
} as const satisfies Record<string, keyof paths>;

type Route = (typeof REPORTS_ROUTES)[keyof typeof REPORTS_ROUTES];

function createReportFetcher<R extends Route>(
  fetcher: ApiFetcher,
  route: R
): (
  query: OpQueryParams<OpForPath<R, 'get'>>
) => Promise<OpResponseBodyTable<OpForPath<R, 'get'>>> {
  type Op = OpForPath<R, 'get'>;
  type Query = OpQueryParams<Op>;
  type Arg = OpArgType<Op>;
  type Table = OpResponseBodyTable<Op>;
  const get = fetcher.path(route).method('get').create();
  return async (query: Query): Promise<Table> => {
    const { data } = await get(query as Arg);
    return data as Table;
  };
}

export type BalanceSheetTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.BALANCE_SHEET, 'get'>
>;
export type BalanceSheetTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.BALANCE_SHEET, 'get'>
>;
export async function fetchBalanceSheetTable(
  fetcher: ApiFetcher,
  query: BalanceSheetTableQuery
): Promise<BalanceSheetTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.BALANCE_SHEET)(query);
}

export type TrialBalanceSheetTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.TRIAL_BALANCE_SHEET, 'get'>
>;
export type TrialBalanceSheetTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.TRIAL_BALANCE_SHEET, 'get'>
>;
export async function fetchTrialBalanceSheetTable(
  fetcher: ApiFetcher,
  query: TrialBalanceSheetTableQuery
): Promise<TrialBalanceSheetTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.TRIAL_BALANCE_SHEET)(query);
}

export type ProfitLossSheetTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.PROFIT_LOSS_SHEET, 'get'>
>;
export type ProfitLossSheetTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.PROFIT_LOSS_SHEET, 'get'>
>;
export async function fetchProfitLossSheetTable(
  fetcher: ApiFetcher,
  query: ProfitLossSheetTableQuery
): Promise<ProfitLossSheetTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.PROFIT_LOSS_SHEET)(query);
}

export type CashflowStatementTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.CASHFLOW_STATEMENT, 'get'>
>;
export type CashflowStatementTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.CASHFLOW_STATEMENT, 'get'>
>;
export async function fetchCashflowStatementTable(
  fetcher: ApiFetcher,
  query: CashflowStatementTableQuery
): Promise<CashflowStatementTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.CASHFLOW_STATEMENT)(query);
}

export type GeneralLedgerTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.GENERAL_LEDGER, 'get'>
>;
export type GeneralLedgerTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.GENERAL_LEDGER, 'get'>
>;
export async function fetchGeneralLedgerTable(
  fetcher: ApiFetcher,
  query: GeneralLedgerTableQuery
): Promise<GeneralLedgerTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.GENERAL_LEDGER)(query);
}

export type JournalTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.JOURNAL, 'get'>
>;
export type JournalTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.JOURNAL, 'get'>
>;
export async function fetchJournalTable(
  fetcher: ApiFetcher,
  query: JournalTableQuery
): Promise<JournalTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.JOURNAL)(query);
}

export type ReceivableAgingSummaryTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.RECEIVABLE_AGING_SUMMARY, 'get'>
>;
export type ReceivableAgingSummaryTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.RECEIVABLE_AGING_SUMMARY, 'get'>
>;
export async function fetchReceivableAgingSummaryTable(
  fetcher: ApiFetcher,
  query: ReceivableAgingSummaryTableQuery
): Promise<ReceivableAgingSummaryTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.RECEIVABLE_AGING_SUMMARY)(query);
}

export type PayableAgingSummaryTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.PAYABLE_AGING_SUMMARY, 'get'>
>;
export type PayableAgingSummaryTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.PAYABLE_AGING_SUMMARY, 'get'>
>;
export async function fetchPayableAgingSummaryTable(
  fetcher: ApiFetcher,
  query: PayableAgingSummaryTableQuery
): Promise<PayableAgingSummaryTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.PAYABLE_AGING_SUMMARY)(query);
}

export type CustomerBalanceSummaryTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.CUSTOMER_BALANCE_SUMMARY, 'get'>
>;
export type CustomerBalanceSummaryTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.CUSTOMER_BALANCE_SUMMARY, 'get'>
>;
export async function fetchCustomerBalanceSummaryTable(
  fetcher: ApiFetcher,
  query: CustomerBalanceSummaryTableQuery
): Promise<CustomerBalanceSummaryTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.CUSTOMER_BALANCE_SUMMARY)(query);
}

export type VendorBalanceSummaryTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.VENDOR_BALANCE_SUMMARY, 'get'>
>;
export type VendorBalanceSummaryTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.VENDOR_BALANCE_SUMMARY, 'get'>
>;
export async function fetchVendorBalanceSummaryTable(
  fetcher: ApiFetcher,
  query: VendorBalanceSummaryTableQuery
): Promise<VendorBalanceSummaryTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.VENDOR_BALANCE_SUMMARY)(query);
}

export type TransactionsByCustomersTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_CUSTOMERS, 'get'>
>;
export type TransactionsByCustomersTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_CUSTOMERS, 'get'>
>;
export async function fetchTransactionsByCustomersTable(
  fetcher: ApiFetcher,
  query: TransactionsByCustomersTableQuery
): Promise<TransactionsByCustomersTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.TRANSACTIONS_BY_CUSTOMERS)(query);
}

export type TransactionsByVendorsTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_VENDORS, 'get'>
>;
export type TransactionsByVendorsTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_VENDORS, 'get'>
>;
export async function fetchTransactionsByVendorsTable(
  fetcher: ApiFetcher,
  query: TransactionsByVendorsTableQuery
): Promise<TransactionsByVendorsTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.TRANSACTIONS_BY_VENDORS)(query);
}

export type SalesByItemsTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.SALES_BY_ITEMS, 'get'>
>;
export type SalesByItemsTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.SALES_BY_ITEMS, 'get'>
>;
export async function fetchSalesByItemsTable(
  fetcher: ApiFetcher,
  query: SalesByItemsTableQuery
): Promise<SalesByItemsTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.SALES_BY_ITEMS)(query);
}

export type PurchasesByItemsTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.PURCHASES_BY_ITEMS, 'get'>
>;
export type PurchasesByItemsTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.PURCHASES_BY_ITEMS, 'get'>
>;
export async function fetchPurchasesByItemsTable(
  fetcher: ApiFetcher,
  query: PurchasesByItemsTableQuery
): Promise<PurchasesByItemsTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.PURCHASES_BY_ITEMS)(query);
}

export type InventoryValuationTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.INVENTORY_VALUATION, 'get'>
>;
export type InventoryValuationTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.INVENTORY_VALUATION, 'get'>
>;
export async function fetchInventoryValuationTable(
  fetcher: ApiFetcher,
  query: InventoryValuationTableQuery
): Promise<InventoryValuationTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.INVENTORY_VALUATION)(query);
}

export type InventoryItemDetailsTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.INVENTORY_ITEM_DETAILS, 'get'>
>;
export type InventoryItemDetailsTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.INVENTORY_ITEM_DETAILS, 'get'>
>;
export async function fetchInventoryItemDetailsTable(
  fetcher: ApiFetcher,
  query: InventoryItemDetailsTableQuery
): Promise<InventoryItemDetailsTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.INVENTORY_ITEM_DETAILS)(query);
}

export type SalesTaxLiabilitySummaryTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.SALES_TAX_LIABILITY_SUMMARY, 'get'>
>;
export type SalesTaxLiabilitySummaryTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.SALES_TAX_LIABILITY_SUMMARY, 'get'>
>;
export async function fetchSalesTaxLiabilitySummaryTable(
  fetcher: ApiFetcher,
  query: SalesTaxLiabilitySummaryTableQuery
): Promise<SalesTaxLiabilitySummaryTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.SALES_TAX_LIABILITY_SUMMARY)(query);
}

export type TransactionsByReferenceTableQuery = OpQueryParams<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_REFERENCE, 'get'>
>;
export type TransactionsByReferenceTableResponse = OpResponseBodyTable<
  OpForPath<typeof REPORTS_ROUTES.TRANSACTIONS_BY_REFERENCE, 'get'>
>;
export async function fetchTransactionsByReferenceTable(
  fetcher: ApiFetcher,
  query: TransactionsByReferenceTableQuery
): Promise<TransactionsByReferenceTableResponse> {
  return createReportFetcher(fetcher, REPORTS_ROUTES.TRANSACTIONS_BY_REFERENCE)(query);
}
