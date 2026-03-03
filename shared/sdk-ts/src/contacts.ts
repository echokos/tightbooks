import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const CONTACTS_ROUTES = {
  AUTO_COMPLETE: '/api/contacts/auto-complete',
  ACTIVATE: '/api/contacts/{id}/activate',
  INACTIVATE: '/api/contacts/{id}/inactivate',
} as const satisfies Record<string, keyof paths>;

type AutoComplete = paths[typeof CONTACTS_ROUTES.AUTO_COMPLETE]['get'];

type AutoComplete200 = AutoComplete['responses'][200];
export type ContactsAutoCompleteResponse = AutoComplete200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchContactsAutoComplete(fetcher: ApiFetcher): Promise<ContactsAutoCompleteResponse> {
  const get = fetcher.path(CONTACTS_ROUTES.AUTO_COMPLETE).method('get').create();
  const { data } = await get({});
  return data;
}

export async function activateContact(fetcher: ApiFetcher, id: number): Promise<void> {
  const patch = fetcher.path(CONTACTS_ROUTES.ACTIVATE).method('patch').create();
  await patch({ id });
}

export async function inactivateContact(fetcher: ApiFetcher, id: number): Promise<void> {
  const patch = fetcher.path(CONTACTS_ROUTES.INACTIVATE).method('patch').create();
  await patch({ id });
}
