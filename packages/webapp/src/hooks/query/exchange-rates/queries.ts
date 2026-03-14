// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { exchangeRateKeys } from './query-keys';
import useApiRequest from '../../useRequest';

interface LatestExchangeRateQuery {
  fromCurrency?: string;
  toCurrency?: string;
}

/**
 * Retrieves latest exchange rate.
 * @param {number} customerId - Customer id.
 */
export function useLatestExchangeRate(
  { toCurrency, fromCurrency }: LatestExchangeRateQuery,
  props,
) {
  const apiRequest = useApiRequest();

  return useQuery({
    ...props,
    queryKey: exchangeRateKeys.rate(fromCurrency, toCurrency),
    queryFn: () =>
      apiRequest
        .http({
          url: `/api/exchange_rates/latest`,
          method: 'get',
          params: {
            to_currency: toCurrency,
            from_currency: fromCurrency,
          },
        })
        .then((res) => res.data),
  });
}
