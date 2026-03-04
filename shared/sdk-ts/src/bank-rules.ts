import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const BANK_RULES_ROUTES = {
  RULES: '/api/banking/rules',
  RULE_BY_ID: '/api/banking/rules/{id}',
  ACCOUNTS_DISCONNECT: '/api/banking/accounts/{id}/disconnect',
  ACCOUNTS_REFRESH: '/api/banking/accounts/{id}/refresh',
  MATCHING_MATCHED: '/api/banking/matching/matched',
  MATCHING_MATCH: '/api/banking/matching/match',
  MATCHING_UNMATCH: '/api/banking/matching/unmatch/{uncategorizedTransactionId}',
  EXCLUDE: '/api/banking/exclude/{id}',
  EXCLUDE_BULK: '/api/banking/exclude/bulk',
  EXCLUDED_LIST: '/api/banking/exclude',
  RECOGNIZED: '/api/banking/recognized/{recognizedTransactionId}',
  RECOGNIZED_LIST: '/api/banking/recognized',
  PENDING: '/api/banking/pending',
  UNCATEGORIZED_AUTOFILL: '/api/banking/uncategorized/autofill',
} as const satisfies Record<string, keyof paths>;

type GetBankRules = paths[typeof BANK_RULES_ROUTES.RULES]['get'];
type GetBankRule = paths[typeof BANK_RULES_ROUTES.RULE_BY_ID]['get'];
type CreateBankRule = paths[typeof BANK_RULES_ROUTES.RULES]['post'];
type EditBankRule = paths[typeof BANK_RULES_ROUTES.RULE_BY_ID]['put'];
type DeleteBankRule = paths[typeof BANK_RULES_ROUTES.RULE_BY_ID]['delete'];

type GetBankRules200 = GetBankRules['responses'][200];
type GetBankRule200 = GetBankRule['responses'][200];
type CreateBankRule201 = CreateBankRule['responses'][201];

export type BankRulesListResponse = GetBankRules200 extends {
  content?: { 'application/json': infer J };
}
  ? J
  : unknown;
export type BankRuleResponse = GetBankRule200 extends {
  content?: { 'application/json': infer J };
}
  ? J
  : unknown;
export type CreateBankRuleBody = CreateBankRule['requestBody']['content']['application/json'];
export type EditBankRuleBody = EditBankRule['requestBody']['content']['application/json'];
export type CreateBankRuleResponse = CreateBankRule201 extends {
  content?: { 'application/json': infer J };
}
  ? J
  : unknown;

export async function fetchBankRules(fetcher: ApiFetcher): Promise<BankRulesListResponse> {
  const get = fetcher.path(BANK_RULES_ROUTES.RULES).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchBankRule(
  fetcher: ApiFetcher,
  id: number
): Promise<BankRuleResponse> {
  const get = fetcher.path(BANK_RULES_ROUTES.RULE_BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createBankRule(
  fetcher: ApiFetcher,
  body: CreateBankRuleBody
): Promise<CreateBankRuleResponse> {
  const post = fetcher.path(BANK_RULES_ROUTES.RULES).method('post').create();
  const { data } = await post(body);
  return data as CreateBankRuleResponse;
}

export async function editBankRule(
  fetcher: ApiFetcher,
  id: number,
  body: EditBankRuleBody
): Promise<void> {
  const put = fetcher.path(BANK_RULES_ROUTES.RULE_BY_ID).method('put').create();
  await put({ id, ...body });
}

export async function deleteBankRule(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(BANK_RULES_ROUTES.RULE_BY_ID).method('delete').create();
  await del({ id });
}

export async function disconnectBankAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const post = fetcher
    .path(BANK_RULES_ROUTES.ACCOUNTS_DISCONNECT)
    .method('post')
    .create();
  await post({ id });
}

export async function refreshBankAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const post = fetcher
    .path(BANK_RULES_ROUTES.ACCOUNTS_REFRESH)
    .method('post')
    .create();
  await post({ id });
}

export async function fetchMatchedTransactions(
  fetcher: ApiFetcher,
  uncategorizedTransactionIds: number[]
): Promise<unknown> {
  const get = fetcher
    .path(BANK_RULES_ROUTES.MATCHING_MATCHED)
    .method('get')
    .create();
  const ids = uncategorizedTransactionIds.map(String);
  const { data } = await get({ uncategorizedTransactionIds: ids });
  return data;
}

export type MatchTransactionBody = {
  uncategorizedTransactions: number[];
  matchedTransactions: Array<{ reference_type: string; reference_id: number }>;
};

export async function matchTransaction(
  fetcher: ApiFetcher,
  body: MatchTransactionBody
): Promise<void> {
  const post = fetcher.path(BANK_RULES_ROUTES.MATCHING_MATCH).method('post').create();
  await (post as (body: unknown) => Promise<unknown>)(body);
}

export async function unmatchMatchedTransaction(
  fetcher: ApiFetcher,
  uncategorizedTransactionId: number
): Promise<void> {
  const patch = fetcher
    .path(BANK_RULES_ROUTES.MATCHING_UNMATCH)
    .method('patch')
    .create();
  await patch({ uncategorizedTransactionId });
}

export async function excludeBankTransaction(
  fetcher: ApiFetcher,
  id: number | string
): Promise<void> {
  const put = fetcher.path(BANK_RULES_ROUTES.EXCLUDE).method('put').create();
  await put({ id: String(id) });
}

export async function unexcludeBankTransaction(
  fetcher: ApiFetcher,
  id: number | string
): Promise<void> {
  const del = fetcher.path(BANK_RULES_ROUTES.EXCLUDE).method('delete').create();
  await del({ id: String(id) });
}

export async function excludeBankTransactionsBulk(
  fetcher: ApiFetcher,
  ids: Array<number | string>
): Promise<void> {
  const put = fetcher.path(BANK_RULES_ROUTES.EXCLUDE_BULK).method('put').create();
  await (put as (body?: { ids?: unknown[] }) => Promise<unknown>)({ ids });
}

export async function unexcludeBankTransactionsBulk(
  fetcher: ApiFetcher,
  ids: Array<number | string>
): Promise<void> {
  const del = fetcher.path(BANK_RULES_ROUTES.EXCLUDE_BULK).method('delete').create();
  await (del as (body?: { ids?: unknown[] }) => Promise<unknown>)({ ids });
}

export async function fetchRecognizedTransaction(
  fetcher: ApiFetcher,
  recognizedTransactionId: number
): Promise<unknown> {
  const get = fetcher.path(BANK_RULES_ROUTES.RECOGNIZED).method('get').create();
  const { data } = await get({ recognizedTransactionId });
  return data;
}

export async function fetchRecognizedTransactions(
  fetcher: ApiFetcher,
  params?: Record<string, unknown>
): Promise<unknown> {
  const get = fetcher.path(BANK_RULES_ROUTES.RECOGNIZED_LIST).method('get').create();
  const { data } = await (get as (q?: Record<string, unknown>) => Promise<{ data: unknown }>)(
    params ?? {}
  );
  return data;
}

export async function fetchExcludedBankTransactions(
  fetcher: ApiFetcher,
  params?: Record<string, unknown>
): Promise<unknown> {
  const get = fetcher.path(BANK_RULES_ROUTES.EXCLUDED_LIST).method('get').create();
  const { data } = await (get as (q?: Record<string, unknown>) => Promise<{ data: unknown }>)(
    params ?? {}
  );
  return data;
}

export async function fetchPendingTransactions(
  fetcher: ApiFetcher,
  params?: Record<string, unknown>
): Promise<unknown> {
  const get = fetcher.path(BANK_RULES_ROUTES.PENDING).method('get').create();
  const { data } = await (get as (q?: Record<string, unknown>) => Promise<{ data: unknown }>)(
    params ?? {}
  );
  return data;
}

export async function fetchAutofillCategorizeTransaction(
  fetcher: ApiFetcher,
  uncategorizedTransactionIds: number[]
): Promise<unknown> {
  const get = fetcher
    .path(BANK_RULES_ROUTES.UNCATEGORIZED_AUTOFILL)
    .method('get')
    .create();
  const { data } = await (get as (q: unknown) => Promise<{ data: unknown }>)({
    uncategorizedTransactionIds,
  });
  return data;
}
