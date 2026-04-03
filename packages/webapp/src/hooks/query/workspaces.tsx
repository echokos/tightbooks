// @ts-nocheck
import { useRequestQuery } from '../useQueryRequest';

/**
 * Retrieve workspaces of the authenticated user.
 */
export function useWorkspaces(props) {
  return useRequestQuery(
    ['workspaces'],
    { method: 'get', url: 'workspaces' },
    {
      select: (res) => res.data.workspaces,
      initialDataUpdatedAt: 0,
      initialData: {
        data: {
          workspaces: [],
        },
      },
      ...props,
    },
  );
}
