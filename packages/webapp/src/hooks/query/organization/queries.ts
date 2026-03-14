// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batch } from 'react-redux';
import { omit } from 'lodash';
import {
  fetchOrganizationCurrent,
  buildOrganization,
  updateOrganization,
  fetchOrgBaseCurrencyMutateAbilities,
} from '@bigcapital/sdk-ts';
import { organizationKeys } from './query-keys';
import { subscriptionsKeys } from '../subscriptions/query-keys';
import { useApiFetcher } from '../../useRequest';
import { useRequestQuery } from '../../useQueryRequest';
import { useSetOrganizations, useSetSubscriptions } from '../../state';

/**
 * Retrieve organizations of the authenticated user.
 * Uses useRequestQuery because organization/all is not in OpenAPI schema.
 */
export function useOrganizations(props) {
  return useRequestQuery(
    organizationKeys.all(),
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
    ...props,
    queryKey: organizationKeys.current(),
    queryFn: () => fetchOrganizationCurrent(fetcher),
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
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => buildOrganization(fetcher, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.current() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all() });
    },
  });
}

/**
 * Saves the organization.
 */
export function useUpdateOrganization(props = {}) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (information) => updateOrganization(fetcher, information),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.current() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all() });
    },
  });
}

export function useOrgBaseCurrencyMutateAbilities(props) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: organizationKeys.mutateAbilities(),
    queryFn: () => fetchOrgBaseCurrencyMutateAbilities(fetcher),
    select: (data: { abilities?: unknown }) => data?.abilities ?? [],
  });
}
