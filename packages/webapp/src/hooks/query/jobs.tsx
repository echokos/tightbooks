// @ts-nocheck
import { transformToCamelCase } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchOrganizationBuildJob } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

/**
 * Retrieve the job metadata.
 */
export function useJob(jobId, props = {}) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: ['JOB', jobId],
    queryFn: () =>
      fetchOrganizationBuildJob(fetcher, jobId).then((data) => transformToCamelCase(data)),
    enabled: jobId != null,
  });
}
