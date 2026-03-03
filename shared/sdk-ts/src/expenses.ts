import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const EXPENSES_ROUTES = {
  LIST: '/api/expenses',
  BY_ID: '/api/expenses/{id}',
  PUBLISH: '/api/expenses/{id}/publish',
  VALIDATE_BULK_DELETE: '/api/expenses/validate-bulk-delete',
  BULK_DELETE: '/api/expenses/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetExpenses = paths[typeof EXPENSES_ROUTES.LIST]['get'];
type GetExpense = paths[typeof EXPENSES_ROUTES.BY_ID]['get'];
type CreateExpense = paths[typeof EXPENSES_ROUTES.LIST]['post'];
type EditExpense = paths[typeof EXPENSES_ROUTES.BY_ID]['put'];
type DeleteExpense = paths[typeof EXPENSES_ROUTES.BY_ID]['delete'];

type GetExpenses200 = GetExpenses['responses'][200];
type GetExpense200 = GetExpense['responses'][200];
export type ExpensesListResponse = GetExpenses200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type Expense = GetExpense200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateExpenseBody = CreateExpense['requestBody']['content']['application/json'];
export type EditExpenseBody = EditExpense['requestBody']['content']['application/json'];

export async function fetchExpenses(fetcher: ApiFetcher): Promise<ExpensesListResponse> {
  const get = fetcher.path(EXPENSES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchExpense(fetcher: ApiFetcher, id: number): Promise<Expense> {
  const get = fetcher.path(EXPENSES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createExpense(
  fetcher: ApiFetcher,
  values: CreateExpenseBody
): Promise<void> {
  const post = fetcher.path(EXPENSES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editExpense(
  fetcher: ApiFetcher,
  id: number,
  values: EditExpenseBody
): Promise<void> {
  const put = fetcher.path(EXPENSES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteExpense(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(EXPENSES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function publishExpense(fetcher: ApiFetcher, id: number): Promise<void> {
  const post = fetcher.path(EXPENSES_ROUTES.PUBLISH).method('post').create();
  await post({ id });
}
