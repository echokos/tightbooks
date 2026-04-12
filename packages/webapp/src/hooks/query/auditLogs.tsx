// @ts-nocheck
import * as qs from 'qs';
import { useInfiniteQuery } from 'react-query';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest from '../useRequest';
import { normalizeApiPath } from '@/utils';
import t from './types';

/**
 * Paginated audit log list (financial domain events).
 */
export function useAuditLogsQuery(filters, props) {
  const query = qs.stringify(
    {
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
      subject: filters.subject || undefined,
      action: filters.action || undefined,
      userId: filters.userId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    },
    { skipNulls: true },
  );

  return useRequestQuery(
    [t.AUDIT_LOGS, filters],
    { method: 'get', url: `audit-logs?${query}` },
    {
      select: (res) => res.data,
      keepPreviousData: true,
      ...props,
    },
  );
}

/**
 * Distinct subject/action values for audit log filter dropdowns.
 */
export function useAuditLogFilterOptionsQuery(props) {
  return useRequestQuery(
    [t.AUDIT_LOG_FILTER_OPTIONS],
    { method: 'get', url: 'audit-logs/filter-options' },
    {
      defaultData: { subjects: [], actions: [] },
      select: (res) => ({
        subjects: res.data?.subjects ?? [],
        actions: res.data?.actions ?? [],
      }),
      staleTime: 5 * 60 * 1000,
      ...props,
    },
  );
}

/**
 * Infinite audit log list with page-based pagination.
 */
export function useAuditLogsInfinityQuery(filters, infinityProps) {
  const apiRequest = useApiRequest();

  return useInfiniteQuery(
    [t.AUDIT_LOGS, filters],
    async ({ pageParam = 1 }) => {
      const query = qs.stringify(
        {
          page: pageParam,
          pageSize: filters.pageSize ?? 20,
          subject: filters.subject || undefined,
          action: filters.action || undefined,
          userId: filters.userId || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        },
        { skipNulls: true },
      );

      const response = await apiRequest.http({
        method: 'get',
        url: `/api/${normalizeApiPath(`audit-logs?${query}`)}`,
      });
      return response.data;
    },
    {
      getNextPageParam: (lastPage) => {
        const { pagination } = lastPage;
        return pagination.total > pagination.pageSize * pagination.page
          ? pagination.page + 1
          : undefined;
      },
      ...infinityProps,
    },
  );
}
