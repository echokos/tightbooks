/**
 * Maps QBO AccountType strings to BigCapital accountType enum values.
 * Source of truth: packages/server/src/constants/accounts.ts
 */
export const QBO_ACCOUNT_TYPE_MAP: Record<string, string> = {
  'Accounts Payable': 'accounts-payable',
  'Accounts Receivable': 'accounts-receivable',
  Bank: 'bank',
  'Credit Card': 'credit-card',
  'Cost of Goods Sold': 'cost-of-goods-sold',
  Equity: 'equity',
  Expense: 'expense',
  'Other Expense': 'other-expense',
  'Fixed Asset': 'fixed-asset',
  Income: 'income',
  'Other Income': 'other-income',
  'Other Current Asset': 'other-current-asset',
  'Other Current Liability': 'other-current-liability',
  'Long Term Liability': 'long-term-liability',
  'Other Asset': 'non-current-asset',
  'Other Liability': 'non-current-liability',
};
