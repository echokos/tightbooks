import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const TAX_RATES_ROUTES = {
  LIST: '/api/tax-rates',
  BY_ID: '/api/tax-rates/{id}',
  ACTIVATE: '/api/tax-rates/{id}/activate',
  INACTIVATE: '/api/tax-rates/{id}/inactivate',
} as const satisfies Record<string, keyof paths>;

type GetTaxRates = paths[typeof TAX_RATES_ROUTES.LIST]['get'];
type GetTaxRate = paths[typeof TAX_RATES_ROUTES.BY_ID]['get'];
type CreateTaxRate = paths[typeof TAX_RATES_ROUTES.LIST]['post'];
type EditTaxRate = paths[typeof TAX_RATES_ROUTES.BY_ID]['put'];
type DeleteTaxRate = paths[typeof TAX_RATES_ROUTES.BY_ID]['delete'];

type GetTaxRates200 = GetTaxRates['responses'][200];
type GetTaxRate200 = GetTaxRate['responses'][200];
export type TaxRatesListResponse = GetTaxRates200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type TaxRate = GetTaxRate200 extends { content?: { 'application/json': infer J } } ? J : unknown;
export type CreateTaxRateBody = CreateTaxRate extends { requestBody: { content: { 'application/json': infer J } } } ? J : Record<string, unknown>;
export type EditTaxRateBody = EditTaxRate extends { requestBody: { content: { 'application/json': infer J } } } ? J : Record<string, unknown>;

export async function fetchTaxRates(fetcher: ApiFetcher): Promise<TaxRatesListResponse> {
  const get = fetcher.path(TAX_RATES_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function fetchTaxRate(fetcher: ApiFetcher, id: number): Promise<TaxRate> {
  const get = fetcher.path(TAX_RATES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data;
}

export async function createTaxRate(
  fetcher: ApiFetcher,
  values: CreateTaxRateBody
): Promise<void> {
  const post = fetcher.path(TAX_RATES_ROUTES.LIST).method('post').create();
  await post(values as never);
}

export async function editTaxRate(
  fetcher: ApiFetcher,
  id: string,
  values: EditTaxRateBody
): Promise<void> {
  const put = fetcher.path(TAX_RATES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values } as never);
}

export async function deleteTaxRate(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(TAX_RATES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function activateTaxRate(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(TAX_RATES_ROUTES.ACTIVATE).method('put').create();
  await put({ id });
}

export async function inactivateTaxRate(fetcher: ApiFetcher, id: number): Promise<void> {
  const put = fetcher.path(TAX_RATES_ROUTES.INACTIVATE).method('put').create();
  await put({ id });
}
