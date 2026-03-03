import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const SUBSCRIPTION_ROUTES = {
  LIST: '/api/subscription',
  CHECKOUT_URL: '/api/subscription/lemon/checkout_url',
  CANCEL: '/api/subscription/cancel',
  RESUME: '/api/subscription/resume',
  CHANGE: '/api/subscription/change',
} as const satisfies Record<string, keyof paths>;

type GetSubscriptions = paths[typeof SUBSCRIPTION_ROUTES.LIST]['get'];

type GetSubscriptions200 = GetSubscriptions['responses'][200];
export type SubscriptionsListResponse = GetSubscriptions200 extends { content?: { 'application/json': infer J } } ? J : unknown;

export async function fetchSubscriptions(fetcher: ApiFetcher): Promise<SubscriptionsListResponse> {
  const get = fetcher.path(SUBSCRIPTION_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data;
}

export async function cancelSubscription(fetcher: ApiFetcher): Promise<void> {
  const post = fetcher.path(SUBSCRIPTION_ROUTES.CANCEL).method('post').create();
  await post({});
}

export async function resumeSubscription(fetcher: ApiFetcher): Promise<void> {
  const post = fetcher.path(SUBSCRIPTION_ROUTES.RESUME).method('post').create();
  await post({});
}
