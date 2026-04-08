// @ts-nocheck
import * as qs from 'qs';
import { useRequestQuery } from '../useQueryRequest';
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
