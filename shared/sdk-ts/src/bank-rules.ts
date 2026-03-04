import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpRequestBody, OpResponseBody } from './utils';

export const BANK_RULES_ROUTES = {
  RULES: '/api/banking/rules',
  RULE_BY_ID: '/api/banking/rules/{id}',
  ACCOUNTS_DISCONNECT: '/api/banking/accounts/{id}/disconnect',
  ACCOUNTS_REFRESH: '/api/banking/accounts/{id}/refresh',
  ACCOUNTS_PAUSE: '/api/banking/accounts/{id}/pause',
  ACCOUNTS_RESUME: '/api/banking/accounts/{id}/resume',
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

export type BankRulesListResponse = OpResponseBody<OpForPath<typeof BANK_RULES_ROUTES.RULES, 'get'>>;
export type BankRuleResponse = OpResponseBody<OpForPath<typeof BANK_RULES_ROUTES.RULE_BY_ID, 'get'>>;
export type CreateBankRuleBody = OpRequestBody<OpForPath<typeof BANK_RULES_ROUTES.RULES, 'post'>>;
export type EditBankRuleBody = OpRequestBody<OpForPath<typeof BANK_RULES_ROUTES.RULE_BY_ID, 'put'>>;
export type CreateBankRuleResponse = OpResponseBody<OpForPath<typeof BANK_RULES_ROUTES.RULES, 'post'>>;

/** Path params for pause/resume bank account (id = bankAccountId). */
export type PauseBankAccountParams = OpForPath<typeof BANK_RULES_ROUTES.ACCOUNTS_PAUSE, 'post'> extends { parameters: { path: infer P } } ? P : never;
export type ResumeBankAccountParams = OpForPath<typeof BANK_RULES_ROUTES.ACCOUNTS_RESUME, 'post'> extends { parameters: { path: infer P } } ? P : never;

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

export async function pauseBankAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const post = fetcher
    .path(BANK_RULES_ROUTES.ACCOUNTS_PAUSE)
    .method('post')
    .create();
  await post({ id });
}

export async function resumeBankAccount(
  fetcher: ApiFetcher,
  id: number
): Promise<void> {
  const post = fetcher
    .path(BANK_RULES_ROUTES.ACCOUNTS_RESUME)
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
