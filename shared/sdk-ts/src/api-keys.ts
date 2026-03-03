import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const API_KEYS_ROUTES = {
  LIST: '/api/api-keys',
  GENERATE: '/api/api-keys/generate',
  REVOKE: '/api/api-keys/{id}/revoke',
} as const satisfies Record<string, keyof paths>;

type GetApiKeys = paths[typeof API_KEYS_ROUTES.LIST]['get'];
type GenerateApiKey = paths[typeof API_KEYS_ROUTES.GENERATE]['post'];
type RevokeApiKey = paths[typeof API_KEYS_ROUTES.REVOKE]['put'];

export type ApiKeysList = GetApiKeys['responses'][200]['content']['application/json'];
export type GenerateApiKeyBody = GenerateApiKey['requestBody']['content']['application/json'];

export async function fetchApiKeys(fetcher: ApiFetcher): Promise<ApiKeysList> {
  const get = fetcher.path(API_KEYS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function generateApiKey(
  fetcher: ApiFetcher,
  body: GenerateApiKeyBody
): Promise<void> {
  const post = fetcher.path(API_KEYS_ROUTES.GENERATE).method('post').create();
  await post(body);
}

export async function revokeApiKey(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(API_KEYS_ROUTES.REVOKE).method('put').create();
  await put({ id });
}
