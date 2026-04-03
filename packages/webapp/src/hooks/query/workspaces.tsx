// @ts-nocheck
import { useMutation, useQueryClient } from 'react-query';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest from '../useRequest';
import { transformToCamelCase } from '@/utils';

/**
 * Retrieve workspaces of the authenticated user.
 */
export function useWorkspaces(props) {
  return useRequestQuery(
    ['workspaces'],
    { method: 'get', url: 'workspaces' },
    {
      select: (res) => transformToCamelCase(res.data),
      initialDataUpdatedAt: 0,
      initialData: [],
      ...props,
    },
  );
}

/**
 * Creates a new workspace.
 */
export function useCreateWorkspace() {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation(
    async (values) => {
      const response = await apiRequest.post('workspaces', values);
      return transformToCamelCase(response.data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
      },
    }
  );
}

/**
 * Sets the default workspace for the authenticated user.
 */
export function useSetDefaultWorkspace() {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation(
    async (values: { organizationId: string }) => {
      const response = await apiRequest.put('workspaces/default', values);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
      },
    }
  );
}
