import type { ApiFetcher } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpQueryParams, OpRequestBody, OpResponseBody } from './utils';

export const SETTINGS_ROUTES = {
  GET_SAVE: '/api/settings',
} as const satisfies Record<string, keyof paths>;

export type SettingsResponse = OpResponseBody<OpForPath<typeof SETTINGS_ROUTES.GET_SAVE, 'get'>>;
export type SaveSettingsBody = OpRequestBody<OpForPath<typeof SETTINGS_ROUTES.GET_SAVE, 'put'>>;
export type GetSettingsQuery = OpQueryParams<OpForPath<typeof SETTINGS_ROUTES.GET_SAVE, 'get'>>;

export async function fetchSettings(
  fetcher: ApiFetcher,
  query?: GetSettingsQuery
): Promise<SettingsResponse> {
  const get = fetcher.path(SETTINGS_ROUTES.GET_SAVE).method('get').create();
  const { data } = await (get as (params?: GetSettingsQuery) => Promise<{ data: SettingsResponse }>)(
    query ?? {}
  );
  return data;
}

export async function saveSettings(
  fetcher: ApiFetcher,
  values: SaveSettingsBody
): Promise<void> {
  const put = fetcher.path(SETTINGS_ROUTES.GET_SAVE).method('put').create();
  await put(values);
}
