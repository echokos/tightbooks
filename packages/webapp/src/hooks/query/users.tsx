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
import { useApiFetcher } from '../useRequest';
import { useSetFeatureDashboardMeta } from '../state/feature';
import t from './types';
import { useSetAuthEmailConfirmed } from '../state';

// Common invalidate queries.
const commonInvalidateQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [t.USERS] });
};

export function useCreateInviteUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values) => inviteUser(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useEditUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]) => editUser(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useInactivateUser(props) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => inactivateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useActivateUser(props) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => activateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteUser(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id) => deleteUser(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useUsers(props) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.USERS],
    queryFn: () => fetchUsers(fetcher),
    ...props,
  });
}

export function useUser(id, props) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.USER, id],
    queryFn: () => fetchUser(fetcher, id),
    enabled: id != null,
    ...props,
  });
}

export function useAuthenticatedAccount(props) {
  const setEmailConfirmed = useSetAuthEmailConfirmed();
  const fetcher = useApiFetcher();

  const state = useQuery({
    queryKey: ['AuthenticatedAccount'],
    queryFn: () => fetchAuthedAccount(fetcher),
    ...props,
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
