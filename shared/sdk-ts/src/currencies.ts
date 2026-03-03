import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const CURRENCIES_ROUTES = {
  LIST: '/api/currencies',
  BY_ID: '/api/currencies/{id}',
  BY_CODE: '/api/currencies/{code}',
  BY_CURRENCY_CODE: '/api/currencies/{currencyCode}',
} as const satisfies Record<string, keyof paths>;

type GetCurrencies = paths[typeof CURRENCIES_ROUTES.LIST]['get'];
type GetCurrencyByCode = paths[typeof CURRENCIES_ROUTES.BY_CURRENCY_CODE]['get'];

type GetCurrencies200 = GetCurrencies['responses'][200];
type GetCurrencyByCode200 = GetCurrencyByCode['responses'][200];
export type CurrenciesListResponse = GetCurrencies200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type Currency = GetCurrencyByCode200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchCurrencies(fetcher: ApiFetcher): Promise<CurrenciesListResponse> {
  const get = fetcher.path(CURRENCIES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchCurrencyByCode(fetcher: ApiFetcher, currencyCode: string): Promise<Currency> {
  const get = fetcher.path(CURRENCIES_ROUTES.BY_CURRENCY_CODE).method('get').create();
  const { data } = await get({ currencyCode });
  return data;
}

/** @deprecated Use fetchCurrencyByCode - schema has no get by id */
export async function fetchCurrency(fetcher: ApiFetcher, id: number): Promise<Currency> {
  return fetchCurrencyByCode(fetcher, String(id));
}
