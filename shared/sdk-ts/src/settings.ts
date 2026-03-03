import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const SETTINGS_ROUTES = {
  GET_SAVE: '/api/settings',
} as const satisfies Record<string, keyof paths>;

type GetSettings = paths[typeof SETTINGS_ROUTES.GET_SAVE]['get'];
type SaveSettings = paths[typeof SETTINGS_ROUTES.GET_SAVE]['put'];

type GetSettings200 = GetSettings['responses'][200];
type SaveSettingsRequestBody = SaveSettings extends { requestBody: { content: { 'application/json': infer J } } } ? J : Record<string, unknown>;
export type SettingsResponse = GetSettings200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type SaveSettingsBody = SaveSettingsRequestBody;

export async function fetchSettings(fetcher: ApiFetcher): Promise<SettingsResponse> {
  const get = fetcher.path(SETTINGS_ROUTES.GET_SAVE).method('get').create();
  const { data } = await get({});
  return data;
}

export async function saveSettings(
  fetcher: ApiFetcher,
  values: SaveSettingsBody
): Promise<void> {
  const put = fetcher.path(SETTINGS_ROUTES.GET_SAVE).method('put').create();
  await put(values);
}
