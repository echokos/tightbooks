// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, fetchUser } from '@bigcapital/sdk-ts';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { useSetFeatureDashboardMeta } from '../state/feature';
import t from './types';
import { useSetAuthEmailConfirmed } from '../state';

// Common invalidate queries.
const commonInvalidateQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [t.USERS] });
};

/**
 * Create a new invite user.
 */
export function useCreateInviteUser(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (values) => apiRequest.patch('invite', values),
        onSuccess: () => {
      // Common invalidate queries.
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Edits the given user.
 */
export function useEditUser(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: ([id, values]) => apiRequest.put(`users/${id}`, values),
        onSuccess: (res, [id, values]) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });

      // Common invalidate queries.
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useInactivateUser(props) {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: (userId) => apiRequest.put(`users/${userId}/inactivate`),
        onSuccess: (res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });

      // Common invalidate queries.
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useActivateUser(props) {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: (userId) => apiRequest.put(`users/${userId}/activate`),
        onSuccess: (res, userId) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, userId] });

      // Common invalidate queries.
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given user.
 */
export function useDeleteUser(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (id) => apiRequest.delete(`users/${id}`),
        onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.USER, id] });

      // Common invalidate queries.
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieves users list.
 */
export function useUsers(props) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.USERS],
    queryFn: () => fetchUsers(fetcher),
    ...props,
  });
}

/**
 * Retrieve details of the given user.
 */
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

  return useRequestQuery(
    ['AuthenticatedAccount'],
    {
      method: 'get',
      url: `auth/account`,
    },
    {
      select: (response) => response.data,
      defaultData: {},
      onSuccess: (data) => {
        setEmailConfirmed(data.verified, data.email);
      },
      ...props,
    },
  );
}

/**
 * Fetches the dashboard meta.
 */
export const useDashboardMeta = (props) => {
  const setFeatureDashboardMeta = useSetFeatureDashboardMeta();

  const state = useRequestQuery(
    [t.DASHBOARD_META],
    { method: 'get', url: 'dashboard/boot' },
    {
      select: (res) => res.data,
      defaultData: {},
      ...props,
    },
  );
  useEffect(() => {
    if (state.isSuccess) {
      debugger;
      setFeatureDashboardMeta(state.data);
    }
  }, [state.isSuccess, state.data, setFeatureDashboardMeta]);
  return state;
};
