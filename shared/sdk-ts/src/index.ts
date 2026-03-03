/**
 * Re-export OpenAPI-generated types for use by server and webapp.
 * Run `pnpm run generate:sdk-types` from repo root to regenerate schema from the server OpenAPI spec.
 */
export type { paths, components, operations } from './schema';
export { normalizeApiPath, ApiFetcher } from './fetch-utils';
export {
  ACCOUNTS_ROUTES,
  fetchAccounts,
  fetchAccount,
  fetchAccountTypes,
  fetchAccountTransactions,
  createAccount,
  editAccount,
  deleteAccount,
  activateAccount,
  inactivateAccount,
  bulkDeleteAccounts,
  validateBulkDeleteAccounts,
} from './accounts';
export type {
  AccountsList,
  Account,
  AccountTypesList,
  AccountTransactionsList,
  CreateAccountBody,
  EditAccountBody,
  BulkDeleteBody,
  ValidateBulkDeleteResponse,
  GetAccountsQuery,
} from './accounts';
export {
  CREDIT_NOTES_ROUTES,
  fetchCreditNotes,
  fetchCreditNote,
  fetchCreditNoteState,
  createCreditNote,
  editCreditNote,
  deleteCreditNote,
  openCreditNote,
  validateBulkDeleteCreditNotes,
  bulkDeleteCreditNotes,
  fetchCreditNoteRefunds,
  createRefundCreditNote,
  deleteRefundCreditNote,
  fetchAppliedInvoices,
  fetchCreditNoteAssociatedInvoicesToApply,
  applyCreditNoteToInvoices,
  deleteApplyCreditNoteToInvoices,
} from './credit-notes';
export type {
  CreditNotesListResponse,
  CreditNote,
  CreateCreditNoteBody,
  EditCreditNoteBody,
  ValidateBulkDeleteCreditNotesBody,
  ValidateBulkDeleteCreditNotesResponse,
  BulkDeleteCreditNotesBody,
  CreateRefundCreditNoteBody,
  ApplyCreditNoteToInvoicesBody,
} from './credit-notes';
export {
  API_KEYS_ROUTES,
  fetchApiKeys,
  generateApiKey,
  revokeApiKey,
} from './api-keys';
export type { ApiKeysList, GenerateApiKeyBody } from './api-keys';
export {
  SALE_INVOICES_ROUTES,
  fetchSaleInvoices,
  fetchSaleInvoice,
  createSaleInvoice,
  editSaleInvoice,
  deleteSaleInvoice,
} from './sale-invoices';
export type {
  SaleInvoicesListResponse,
  SaleInvoice,
  CreateSaleInvoiceBody,
  EditSaleInvoiceBody,
} from './sale-invoices';
export {
  CUSTOMERS_ROUTES,
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  editCustomer,
  deleteCustomer,
  validateBulkDeleteCustomers,
  bulkDeleteCustomers,
} from './customers';
export type {
  CustomersListResponse,
  Customer,
  CreateCustomerBody,
  EditCustomerBody,
  ValidateBulkDeleteCustomersResponse,
  BulkDeleteCustomersBody,
} from './customers';
export {
  VENDORS_ROUTES,
  fetchVendors,
  fetchVendor,
  createVendor,
  editVendor,
  deleteVendor,
  validateBulkDeleteVendors,
  bulkDeleteVendors,
} from './vendors';
export type {
  VendorsListResponse,
  Vendor,
  CreateVendorBody,
  EditVendorBody,
  ValidateBulkDeleteVendorsResponse,
  BulkDeleteVendorsBody,
} from './vendors';
export {
  BILLS_ROUTES,
  fetchBills,
  fetchBill,
  createBill,
  editBill,
  deleteBill,
} from './bills';
export type {
  BillsListResponse,
  Bill,
  CreateBillBody,
  EditBillBody,
} from './bills';
export {
  ITEMS_ROUTES,
  fetchItems,
  fetchItem,
  createItem,
  editItem,
  deleteItem,
  inactivateItem,
  activateItem,
  validateBulkDeleteItems,
  bulkDeleteItems,
} from './items';
export type {
  ItemsListResponse,
  Item,
  CreateItemBody,
  EditItemBody,
  BulkDeleteItemsBody,
  ValidateBulkDeleteItemsResponse,
} from './items';
export {
  BRANCHES_ROUTES,
  fetchBranches,
  fetchBranch,
  createBranch,
  editBranch,
  deleteBranch,
  activateBranches,
  markBranchAsPrimary,
} from './branches';
export type {
  BranchesListResponse,
  Branch,
  CreateBranchBody,
  EditBranchBody,
} from './branches';
export {
  WAREHOUSES_ROUTES,
  fetchWarehouses,
  fetchWarehouse,
  createWarehouse,
  editWarehouse,
  deleteWarehouse,
  activateWarehouses,
  markWarehousePrimary,
} from './warehouses';
export type {
  WarehousesListResponse,
  Warehouse,
  CreateWarehouseBody,
  EditWarehouseBody,
} from './warehouses';
export {
  EXPENSES_ROUTES,
  fetchExpenses,
  fetchExpense,
  createExpense,
  editExpense,
  deleteExpense,
  publishExpense,
} from './expenses';
export type {
  ExpensesListResponse,
  Expense,
  CreateExpenseBody,
  EditExpenseBody,
} from './expenses';
export {
  MANUAL_JOURNALS_ROUTES,
  fetchManualJournals,
  fetchManualJournal,
  createManualJournal,
  editManualJournal,
  deleteManualJournal,
  publishManualJournal,
} from './manual-journals';
export type {
  ManualJournalsListResponse,
  ManualJournal,
  CreateManualJournalBody,
  EditManualJournalBody,
} from './manual-journals';
export {
  ROLES_ROUTES,
  fetchRoles,
  fetchRole,
  createRole,
  editRole,
  deleteRole,
  fetchRolePermissionsSchema,
} from './roles';
export type {
  RolesListResponse,
  Role,
  CreateRoleBody,
  EditRoleBody,
  RolePermissionsSchema,
} from './roles';
export {
  USERS_ROUTES,
  fetchUsers,
  fetchUser,
  editUser,
  deleteUser,
  activateUser,
  inactivateUser,
} from './users';
export type {
  UsersListResponse,
  User,
  EditUserBody,
  GetUsersQuery,
} from './users';
export {
  SETTINGS_ROUTES,
  fetchSettings,
  saveSettings,
} from './settings';
export type { SettingsResponse, SaveSettingsBody } from './settings';
export {
  ORGANIZATION_ROUTES,
  fetchOrganizationCurrent,
  fetchOrganization,
  updateOrganization,
} from './organization';
export type {
  OrganizationCurrent,
  Organization,
  UpdateOrganizationBody,
} from './organization';
export {
  SUBSCRIPTION_ROUTES,
  fetchSubscriptions,
  cancelSubscription,
  resumeSubscription,
} from './subscription';
export type { SubscriptionsListResponse } from './subscription';
export {
  CURRENCIES_ROUTES,
  fetchCurrencies,
  fetchCurrency,
  fetchCurrencyByCode,
} from './currencies';
export type { CurrenciesListResponse, Currency } from './currencies';
export {
  INVITE_ROUTES,
  inviteUser,
  resendInvite,
} from './invite';
export type { InviteUserBody } from './invite';
export {
  AUTH_ROUTES,
  fetchAuthedAccount,
} from './authentication';
export type { AuthedAccount } from './authentication';
export {
  CONTACTS_ROUTES,
  fetchContactsAutoComplete,
  activateContact,
  inactivateContact,
} from './contacts';
export type { ContactsAutoCompleteResponse } from './contacts';
export {
  ITEMS_CATEGORIES_ROUTES,
  fetchItemCategories,
  fetchItemCategory,
  createItemCategory,
  editItemCategory,
  deleteItemCategory,
} from './items-categories';
export type {
  ItemCategoriesListResponse,
  ItemCategory,
  CreateItemCategoryBody,
  EditItemCategoryBody,
} from './items-categories';
export {
  VIEWS_ROUTES,
  fetchResourceView,
} from './views';
export type { ResourceViewResponse } from './views';
export {
  TRANSACTIONS_LOCKING_ROUTES,
  fetchTransactionsLocking,
  fetchTransactionsLockingByModule,
} from './transactions-locking';
export {
  VENDOR_CREDITS_ROUTES,
  fetchVendorCredits,
  fetchVendorCredit,
  createVendorCredit,
  editVendorCredit,
  deleteVendorCredit,
  openVendorCredit,
} from './vendor-credits';
export type {
  VendorCreditsListResponse,
  VendorCredit,
  CreateVendorCreditBody,
  EditVendorCreditBody,
} from './vendor-credits';
export {
  SALE_ESTIMATES_ROUTES,
  fetchSaleEstimates,
  fetchSaleEstimate,
  createSaleEstimate,
  editSaleEstimate,
  deleteSaleEstimate,
} from './sale-estimates';
export type {
  SaleEstimatesListResponse,
  SaleEstimate,
  CreateSaleEstimateBody,
  EditSaleEstimateBody,
} from './sale-estimates';
export {
  SALE_RECEIPTS_ROUTES,
  fetchSaleReceipts,
  fetchSaleReceipt,
  createSaleReceipt,
  editSaleReceipt,
  deleteSaleReceipt,
} from './sale-receipts';
export type {
  SaleReceiptsListResponse,
  SaleReceipt,
  CreateSaleReceiptBody,
  EditSaleReceiptBody,
} from './sale-receipts';
export {
  PAYMENTS_RECEIVED_ROUTES,
  fetchPaymentsReceived,
  fetchPaymentReceived,
  createPaymentReceived,
  editPaymentReceived,
  deletePaymentReceived,
} from './payment-receives';
export type {
  PaymentsReceivedListResponse,
  PaymentReceived,
  CreatePaymentReceivedBody,
  EditPaymentReceivedBody,
} from './payment-receives';
export {
  BILL_PAYMENTS_ROUTES,
  fetchBillPayments,
  fetchBillPayment,
  createBillPayment,
  editBillPayment,
  deleteBillPayment,
} from './payment-mades';
export type {
  BillPaymentsListResponse,
  BillPayment,
  CreateBillPaymentBody,
  EditBillPaymentBody,
} from './payment-mades';
export {
  INVENTORY_ADJUSTMENTS_ROUTES,
  fetchInventoryAdjustments,
  fetchInventoryAdjustment,
  createQuickInventoryAdjustment,
  deleteInventoryAdjustment,
  publishInventoryAdjustment,
} from './inventory-adjustments';
export type {
  InventoryAdjustmentsListResponse,
  InventoryAdjustment,
  CreateQuickInventoryAdjustmentBody,
} from './inventory-adjustments';
export {
  WAREHOUSE_TRANSFERS_ROUTES,
  fetchWarehouseTransfers,
  fetchWarehouseTransfer,
  createWarehouseTransfer,
  editWarehouseTransfer,
  deleteWarehouseTransfer,
  initiateWarehouseTransfer,
  transferredWarehouseTransfer,
} from './warehouse-transfers';
export type {
  WarehouseTransfersListResponse,
  WarehouseTransfer,
  CreateWarehouseTransferBody,
  EditWarehouseTransferBody,
} from './warehouse-transfers';
export {
  LANDED_COST_ROUTES,
  fetchLandedCostTransactions,
} from './landed-cost';
export type { LandedCostTransactionsResponse } from './landed-cost';
export {
  GENERIC_RESOURCE_ROUTES,
  fetchResourceMeta,
} from './generic-resource';
export type { ResourceMetaResponse } from './generic-resource';
export {
  BANKING_ACCOUNTS_ROUTES,
  fetchBankingAccounts,
  fetchBankingAccountSummary,
} from './cashflow-accounts';
export type { BankingAccountsListResponse } from './cashflow-accounts';
