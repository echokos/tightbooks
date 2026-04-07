// @ts-nocheck
import { useMutation, useQueryClient } from 'react-query';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest from '../useRequest';
import { useAuthOrganizationId } from '../state';
import { transformToCamelCase } from '@/utils';

/**
 * Retrieve workspaces of the authenticated user.
 * @param options.includeInactive - Whether to include inactive workspaces (default: false)
 */
export function useWorkspaces(options = {}) {
  const { includeInactive = false, ...props } = options;
  const currentOrganizationId = useAuthOrganizationId();

  return useRequestQuery(
    ['workspaces', { includeInactive }],
    { method: 'get', url: 'workspaces', params: { includeInactive, currentOrganizationId } },
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

/**
 * Deletes a workspace (owner only).
 */
export function useDeleteWorkspace(props?: any) {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation(
    async (organizationId: string) => {
      const response = await apiRequest.delete(`workspaces/${organizationId}`);
      return transformToCamelCase(response.data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
      },
      ...props,
    }
  );
}

/**
 * Inactivates a workspace (owner only).
 */
export function useInactivateWorkspace(props?: any) {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation(
    async (organizationId: string) => {
      const response = await apiRequest.put(
        `workspaces/${organizationId}/inactivate`
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
      },
      ...props,
    }
  );
}

/**
 * Activates (reactivates) a workspace (owner only).
 */
export function useActivateWorkspace(props?: any) {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation(
    async (organizationId: string) => {
      const response = await apiRequest.put(
        `workspaces/${organizationId}/activate`
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workspaces']);
      },
      ...props,
    }
  );
}
