import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  User,
  UsersListResponse,
  EditUserBody,
  GetUsersQuery,
  InviteUserBody,
  AuthedAccount,
  GetDashboardBootMetaResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchUsers,
  fetchUser,
  editUser,
  deleteUser,
  activateUser,
  inactivateUser,
  inviteUser,
  resendInvite,
  fetchAuthedAccount,
  fetchDashboardBootMeta,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { useSetFeatureDashboardMeta } from '../state/feature';
import t from './types';
import { useSetAuthEmailConfirmed } from '../state';

// Common invalidate queries.
const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.USERS] });
};

/**
 * Create a new invite user.
 */
export function useCreateInviteUser(
  props?: UseMutationOptions<void, Error, InviteUserBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: InviteUserBody) => inviteUser(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Edits the given user.
 */
export function useEditUser(
  props?: UseMutationOptions<void, Error, [number, EditUserBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditUserBody]) =>
      editUser(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useInactivateUser(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (userId: number) => inactivateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useActivateUser(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (userId: number) => activateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given user.
 */
export function useDeleteUser(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteUser(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieves users list.
 */
export function useUsers(
  query?: GetUsersQuery,
  props?: Omit<UseQueryOptions<UsersListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.USERS, query],
    queryFn: () => fetchUsers(fetcher, query ?? { page: 1, page_size: 20 }),
    ...props,
  });
}

/**
 * Retrieve details of the given user.
 */
export function useUser(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.USER, id],
    queryFn: () => fetchUser(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useAuthenticatedAccount(
  props?: Omit<UseQueryOptions<AuthedAccount>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['AuthenticatedAccount'],
    queryFn: () => fetchAuthedAccount(fetcher),
    ...props,
  });
}

// Hook to handle side effects from useAuthenticatedAccount
export function useAuthenticatedAccountEffect() {
  const setEmailConfirmed = useSetAuthEmailConfirmed();
  const { data, isSuccess } = useAuthenticatedAccount();

  useEffect(() => {
    if (isSuccess && data) {
      setEmailConfirmed(data.verified, data.email);
    }
  }, [isSuccess, data, setEmailConfirmed]);
}

/**
 * Fetches the dashboard meta.
 */
export const useDashboardMeta = (
  props?: Omit<
    UseQueryOptions<GetDashboardBootMetaResponse>,
    'queryKey' | 'queryFn'
  >
) => {
  const setFeatureDashboardMeta = useSetFeatureDashboardMeta();
  const fetcher = useApiFetcher();

  const state = useQuery<GetDashboardBootMetaResponse>({
    queryKey: [t.DASHBOARD_META],
    queryFn: () => fetchDashboardBootMeta(fetcher),
    ...props,
  });

  useEffect(() => {
    if (state.isSuccess && state.data) {
      setFeatureDashboardMeta(state.data);
    }
  }, [state.isSuccess, state.data, setFeatureDashboardMeta]);

  return state;
};
