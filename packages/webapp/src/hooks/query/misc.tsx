import { useQuery } from '@tanstack/react-query';
import { fetchDateFormats } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

/**
 * Retrieve the job metadata.
 */
export function useDateFormats(props = {}) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: ['DATE_FORMATS'],
    queryFn: () => fetchDateFormats(fetcher),
    ...props,
  });
}
