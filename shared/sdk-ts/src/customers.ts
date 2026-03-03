import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const CUSTOMERS_ROUTES = {
  LIST: '/api/customers',
  BY_ID: '/api/customers/{id}',
  OPENING_BALANCE: '/api/customers/{id}/opening-balance',
  VALIDATE_BULK_DELETE: '/api/customers/validate-bulk-delete',
  BULK_DELETE: '/api/customers/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetCustomers = paths[typeof CUSTOMERS_ROUTES.LIST]['get'];
type GetCustomer = paths[typeof CUSTOMERS_ROUTES.BY_ID]['get'];
type CreateCustomer = paths[typeof CUSTOMERS_ROUTES.LIST]['post'];
type EditCustomer = paths[typeof CUSTOMERS_ROUTES.BY_ID]['put'];
type DeleteCustomer = paths[typeof CUSTOMERS_ROUTES.BY_ID]['delete'];
type ValidateBulkDelete = paths[typeof CUSTOMERS_ROUTES.VALIDATE_BULK_DELETE]['post'];
type BulkDelete = paths[typeof CUSTOMERS_ROUTES.BULK_DELETE]['post'];

export type CustomersListResponse = GetCustomers['responses'][200]['content']['application/json'];
export type Customer = GetCustomer['responses'][200]['content']['application/json'];
export type CreateCustomerBody = CreateCustomer['requestBody']['content']['application/json'];
export type EditCustomerBody = EditCustomer['requestBody']['content']['application/json'];
export type ValidateBulkDeleteCustomersResponse = ValidateBulkDelete['responses'][200]['content']['application/json'];
export type BulkDeleteCustomersBody = BulkDelete['requestBody']['content']['application/json'];

export async function fetchCustomers(fetcher: ApiFetcher): Promise<CustomersListResponse> {
  const get = fetcher.path(CUSTOMERS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchCustomer(fetcher: ApiFetcher, id: number): Promise<Customer> {
  const get = fetcher.path(CUSTOMERS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createCustomer(
  fetcher: ApiFetcher,
  values: CreateCustomerBody
): Promise<void> {
  const post = fetcher.path(CUSTOMERS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editCustomer(
  fetcher: ApiFetcher,
  id: number,
  values: EditCustomerBody
): Promise<void> {
  const put = fetcher.path(CUSTOMERS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteCustomer(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(CUSTOMERS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function validateBulkDeleteCustomers(
  fetcher: ApiFetcher,
  body: BulkDeleteCustomersBody
): Promise<ValidateBulkDeleteCustomersResponse> {
  const validate = fetcher.path(CUSTOMERS_ROUTES.VALIDATE_BULK_DELETE).method('post').create();
  const { data } = await validate(body);
  return data;
}

export async function bulkDeleteCustomers(
  fetcher: ApiFetcher,
  body: BulkDeleteCustomersBody
): Promise<void> {
  const post = fetcher.path(CUSTOMERS_ROUTES.BULK_DELETE).method('post').create();
  await post(body);
}
