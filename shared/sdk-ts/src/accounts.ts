import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ACCOUNTS_ROUTES = {
  LIST: '/api/accounts',
  BY_ID: '/api/accounts/{id}',
  TYPES: '/api/accounts/types',
  TRANSACTIONS: '/api/accounts/transactions',
  BULK_DELETE: '/api/accounts/bulk-delete',
  VALIDATE_BULK_DELETE: '/api/accounts/validate-bulk-delete',
  ACTIVATE: '/api/accounts/{id}/activate',
  INACTIVATE: '/api/accounts/{id}/inactivate',
} as const satisfies Record<string, keyof paths>;

type GetAccounts = paths[typeof ACCOUNTS_ROUTES.LIST]['get'];
type GetAccount = paths[typeof ACCOUNTS_ROUTES.BY_ID]['get'];
type GetAccountTypes = paths[typeof ACCOUNTS_ROUTES.TYPES]['get'];
type GetAccountTransactions = paths[typeof ACCOUNTS_ROUTES.TRANSACTIONS]['get'];
type CreateAccount = paths[typeof ACCOUNTS_ROUTES.LIST]['post'];
type EditAccount = paths[typeof ACCOUNTS_ROUTES.BY_ID]['put'];
type BulkDeleteAccounts = paths[typeof ACCOUNTS_ROUTES.BULK_DELETE]['post'];
type ValidateBulkDelete = paths[typeof ACCOUNTS_ROUTES.VALIDATE_BULK_DELETE]['post'];

export type AccountsList = GetAccounts['responses'][200]['content']['application/json'];
export type Account = GetAccount['responses'][200]['content']['application/json'];
export type AccountTypesList = GetAccountTypes['responses'][200]['content']['application/json'];
export type AccountTransactionsList = GetAccountTransactions['responses'][200]['content']['application/json'];
export type CreateAccountBody = CreateAccount['requestBody']['content']['application/json'];
export type EditAccountBody = EditAccount['requestBody']['content']['application/json'];
export type BulkDeleteBody = BulkDeleteAccounts['requestBody']['content']['application/json'];
export type ValidateBulkDeleteResponse = ValidateBulkDelete['responses'][200]['content']['application/json'];
export type GetAccountsQuery = NonNullable<GetAccounts['parameters']['query']>;

function normalizeAccountsResponse(
  data: AccountsList | { accounts: AccountsList }
): AccountsList {
  return Array.isArray(data) ? data : data.accounts;
}

export async function fetchAccounts(
  fetcher: ApiFetcher,
  query: GetAccountsQuery
): Promise<AccountsList> {
  const getAccounts = fetcher.path(ACCOUNTS_ROUTES.LIST).method('get').create();
  const { data } = await getAccounts(query ?? {});
  return normalizeAccountsResponse(data as AccountsList | { accounts: AccountsList });
}

export async function fetchAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<Account> {
  const getAccount = fetcher.path(ACCOUNTS_ROUTES.BY_ID).method('get').create();
  const { data } = await getAccount({ id });
  return data;
}

export async function fetchAccountTypes(
  fetcher: ApiFetcher
): Promise<AccountTypesList> {
  const getAccountTypes = fetcher.path(ACCOUNTS_ROUTES.TYPES).method('get').create();
  const { data } = await getAccountTypes({});
  return data;
}

export async function fetchAccountTransactions(
  fetcher: ApiFetcher,
  id: number
): Promise<AccountTransactionsList> {
  const getAccountTransactions = fetcher.path(ACCOUNTS_ROUTES.TRANSACTIONS).method('get').create();
  const { data } = await getAccountTransactions({ accountId: id });
  return data;
}

export async function createAccount(
  fetcher: ApiFetcher,
  values: CreateAccountBody
): Promise<void> {
  const create = fetcher.path(ACCOUNTS_ROUTES.LIST).method('post').create();
  await create(values);
}

export async function editAccount(
  fetcher: ApiFetcher,
  id: number,
  values: EditAccountBody
): Promise<void> {
  const put = fetcher.path(ACCOUNTS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const del = fetcher.path(ACCOUNTS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function activateAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const activate = fetcher.path(ACCOUNTS_ROUTES.ACTIVATE).method('post').create();
  await activate({ id });
}

export async function inactivateAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const inactivate = fetcher.path(ACCOUNTS_ROUTES.INACTIVATE).method('post').create();
  await inactivate({ id });
}

export async function bulkDeleteAccounts(
  fetcher: ApiFetcher,
  body: BulkDeleteBody
): Promise<void> {
  const bulkDelete = fetcher.path(ACCOUNTS_ROUTES.BULK_DELETE).method('post').create();
  await bulkDelete(body);
}

export async function validateBulkDeleteAccounts(
  fetcher: ApiFetcher,
  ids: number[]
): Promise<ValidateBulkDeleteResponse> {
  const validate = fetcher.path(ACCOUNTS_ROUTES.VALIDATE_BULK_DELETE).method('post').create();
  const { data } = await validate({ ids, skipUndeletable: false });
  return data as ValidateBulkDeleteResponse;
}
