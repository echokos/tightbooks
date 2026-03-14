// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  fetchUser,
  inviteUser,
  editUser,
  inactivateUser,
  activateUser,
  deleteUser,
  fetchAuthedAccount,
  fetchDashboardBootMeta,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { useSetFeatureDashboardMeta } from '../../state/feature';
import { usersKeys } from './query-keys';
import { useSetAuthEmailConfirmed } from '../../state';

// Common invalidate queries.
const commonInvalidateQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: usersKeys.all() });
};

export function useCreateInviteUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values) => inviteUser(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useEditUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]) => editUser(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useInactivateUser(props) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    ...props,
    mutationFn: (userId) => inactivateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useActivateUser(props) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    ...props,
    mutationFn: (userId) => activateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useDeleteUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id) => deleteUser(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useUsers(props) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: usersKeys.all(),
    queryFn: () => fetchUsers(fetcher),
  });
}

export function useUser(id, props) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: usersKeys.detail(id),
    queryFn: () => fetchUser(fetcher, id),
    enabled: id != null,
  });
}

export function useAuthenticatedAccount(props) {
  const setEmailConfirmed = useSetAuthEmailConfirmed();
  const fetcher = useApiFetcher();

  const state = useQuery({
    ...props,
    queryKey: ['AuthenticatedAccount'],
    queryFn: () => fetchAuthedAccount(fetcher),
  });
  useEffect(() => {
    if (state.isSuccess && state.data) {
      setEmailConfirmed((state.data as { verified?: boolean; email?: string }).verified, (state.data as { email?: string }).email);
    }
  }, [state.isSuccess, state.data, setEmailConfirmed]);
  return { ...state, data: state.data ?? {} };
}

export const useDashboardMeta = (props) => {
  const setFeatureDashboardMeta = useSetFeatureDashboardMeta();
  const fetcher = useApiFetcher();

  const state = useQuery({
    ...props,
    queryKey: ['DASHBOARD_META'],
    queryFn: () => fetchDashboardBootMeta(fetcher),
  });
  useEffect(() => {
    if (state.isSuccess && state.data) {
      setFeatureDashboardMeta(state.data);
    }
  }, [state.isSuccess, state.data, setFeatureDashboardMeta]);
  return state;
};
