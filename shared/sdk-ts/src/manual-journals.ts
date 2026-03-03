import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const MANUAL_JOURNALS_ROUTES = {
  LIST: '/api/manual-journals',
  BY_ID: '/api/manual-journals/{id}',
  PUBLISH: '/api/manual-journals/{id}/publish',
  VALIDATE_BULK_DELETE: '/api/manual-journals/validate-bulk-delete',
  BULK_DELETE: '/api/manual-journals/bulk-delete',
} as const satisfies Record<string, keyof paths>;

type GetManualJournals = paths[typeof MANUAL_JOURNALS_ROUTES.LIST]['get'];
type GetManualJournal = paths[typeof MANUAL_JOURNALS_ROUTES.BY_ID]['get'];
type CreateManualJournal = paths[typeof MANUAL_JOURNALS_ROUTES.LIST]['post'];
type EditManualJournal = paths[typeof MANUAL_JOURNALS_ROUTES.BY_ID]['put'];
type DeleteManualJournal = paths[typeof MANUAL_JOURNALS_ROUTES.BY_ID]['delete'];

type GetManualJournals200 = GetManualJournals['responses'][200];
type GetManualJournal200 = GetManualJournal['responses'][200];
export type ManualJournalsListResponse = GetManualJournals200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type ManualJournal = GetManualJournal200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateManualJournalBody = CreateManualJournal['requestBody']['content']['application/json'];
export type EditManualJournalBody = EditManualJournal['requestBody']['content']['application/json'];

export async function fetchManualJournals(fetcher: ApiFetcher): Promise<ManualJournalsListResponse> {
  const get = fetcher.path(MANUAL_JOURNALS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchManualJournal(fetcher: ApiFetcher, id: number): Promise<ManualJournal> {
  const get = fetcher.path(MANUAL_JOURNALS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createManualJournal(
  fetcher: ApiFetcher,
  values: CreateManualJournalBody
): Promise<void> {
  const post = fetcher.path(MANUAL_JOURNALS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editManualJournal(
  fetcher: ApiFetcher,
  id: number,
  values: EditManualJournalBody
): Promise<void> {
  const put = fetcher.path(MANUAL_JOURNALS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteManualJournal(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(MANUAL_JOURNALS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function publishManualJournal(fetcher: ApiFetcher, id: number): Promise<void> {
  const patch = fetcher.path(MANUAL_JOURNALS_ROUTES.PUBLISH).method('patch').create();
  await patch({ id });
}
