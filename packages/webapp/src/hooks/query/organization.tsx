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
import t from './types';
import { useApiFetcher } from '../useRequest';
import { useRequestQuery } from '../useQueryRequest';
import { useSetOrganizations, useSetSubscriptions } from '../state';

/**
 * Retrieve organizations of the authenticated user.
 * Uses useRequestQuery because organization/all is not in OpenAPI schema.
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
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => buildOrganization(fetcher, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_CURRENT] });
      queryClient.invalidateQueries({ queryKey: [t.ORGANIZATIONS] });
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
    mutationFn: (information) => updateOrganization(fetcher, information),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_CURRENT] });
      queryClient.invalidateQueries({ queryKey: [t.ORGANIZATIONS] });
    },
    ...props,
  });
}

export function useOrgBaseCurrencyMutateAbilities(props) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES],
    queryFn: () => fetchOrgBaseCurrencyMutateAbilities(fetcher),
    select: (data: { abilities?: unknown }) => data?.abilities ?? [],
    ...props,
  });
}
