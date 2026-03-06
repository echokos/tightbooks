// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batch } from 'react-redux';
import { omit } from 'lodash';
import { fetchOrganizationCurrent } from '@bigcapital/sdk-ts';
import t from './types';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { useRequestQuery } from '../useQueryRequest';
import { useSetOrganizations, useSetSubscriptions } from '../state';

const OrganizationRoute = {
  Current: '/organization/current',
  Build: '/organization/build',
};

/**
 * Retrieve organizations of the authenticated user.
 */
export function useOrganizations(props) {
  return useRequestQuery(
    [t.ORGANIZATIONS],
    { method: 'get', url: `organization/all` },
    {
      select: (res) => res.data.organizations,
      initialDataUpdatedAt: 0,
      initialData: {
        data: {
          organizations: [],
        },
      },
      ...props,
    },
  );
}

/**
 * Retrieve the current organization metadata.
 */
export function useCurrentOrganization(props) {
  const setOrganizations = useSetOrganizations();
  const setSubscriptions = useSetSubscriptions();
  const fetcher = useApiFetcher();

  const result = useQuery({
    queryKey: [t.ORGANIZATION_CURRENT],
    queryFn: () => fetchOrganizationCurrent(fetcher),
    ...props,
  });

  useEffect(() => {
    if (result.isSuccess && result.data) {
      const data = result.data as { subscriptions?: unknown; [k: string]: unknown };
      const organization = omit(data, ['subscriptions']);
      batch(() => {
        setSubscriptions(data.subscriptions);
        setOrganizations([organization]);
      });
    }
  }, [result.isSuccess, result.data, setSubscriptions, setOrganizations]);

  return result;
}

/**
 * Organization setup.
 */
export function useOrganizationSetup() {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation({ mutationFn: (values) => apiRequest.post(OrganizationRoute.Build, values),
          onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_CURRENT] });
        queryClient.invalidateQueries({ queryKey: [t.ORGANIZATIONS] });
      },
    },
  );
}

/**
 * Saves the settings.
 */
export function useUpdateOrganization(props = {}) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (information: any) => apiRequest.put('organization', information),
          onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_CURRENT] });
        queryClient.invalidateQueries({ queryKey: [t.ORGANIZATIONS] });
      },
      ...props,
    },
  );
}

export function useOrgBaseCurrencyMutateAbilities(props) {
  return useRequestQuery(
    [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES],
    { method: 'get', url: `organization/base-currency-mutate` },
    {
      select: (res) => res.data.abilities,
      defaultData: [],
      ...props,
    },
  );
}
