import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  RolesListResponse,
  Role,
  RolePermissionsSchema,
  CreateRoleBody,
  EditRoleBody,
} from '@bigcapital/sdk-ts';
import {
  fetchRoles,
  fetchRole,
  fetchRolePermissionsSchema,
  createRole,
  editRole,
  deleteRole,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.ROLE] });
  queryClient.invalidateQueries({ queryKey: [t.ROLES] });
  queryClient.invalidateQueries({ queryKey: [t.ROLES_PERMISSIONS_SCHEMA] });
};

export function useEditRolePermissionSchema(
  props?: UseMutationOptions<void, Error, [number, EditRoleBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: ([id, values]: [number, EditRoleBody]) => editRole(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useCreateRolePermissionSchema(
  props?: UseMutationOptions<void, Error, CreateRoleBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (values: CreateRoleBody) => createRole(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useDeleteRole(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (id: number) => deleteRole(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.ROLE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function usePermissionsSchema(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<RolePermissionsSchema>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ROLES_PERMISSIONS_SCHEMA, query],
    queryFn: () => fetchRolePermissionsSchema(fetcher),
    ...props,
  });
}

export function useRolePermission(
  role_id: number | null | undefined,
  props?: Omit<UseQueryOptions<Role>, 'queryKey' | 'queryFn'>,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ROLE, role_id],
    queryFn: () => fetchRole(fetcher, role_id!),
    enabled: role_id != null,
    ...props,
  });
}

export function useRoles(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<RolesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ROLES, query],
    queryFn: () => fetchRoles(fetcher),
    select: (data) => (Array.isArray(data) ? data : (data as { data?: unknown })?.data ?? data),
    ...props,
  });
}
