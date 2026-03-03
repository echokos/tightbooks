import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const TRANSACTIONS_LOCKING_ROUTES = {
  LOCK: '/api/transactions-locking/lock',
  CANCEL_LOCK: '/api/transactions-locking/cancel-lock',
  UNLOCK_PARTIAL: '/api/transactions-locking/unlock-partial',
  CANCEL_UNLOCK_PARTIAL: '/api/transactions-locking/cancel-unlock-partial',
  LIST: '/api/transactions-locking',
  BY_MODULE: '/api/transactions-locking/{module}',
} as const satisfies Record<string, keyof paths>;

export async function fetchTransactionsLocking(fetcher: ApiFetcher): Promise<void> {
  const get = fetcher.path(TRANSACTIONS_LOCKING_ROUTES.LIST).method('get').create();
  await get({});
}

export async function fetchTransactionsLockingByModule(
  fetcher: ApiFetcher,
  module: string
): Promise<void> {
  const get = fetcher.path(TRANSACTIONS_LOCKING_ROUTES.BY_MODULE).method('get').create();
  await get({ module });
}
