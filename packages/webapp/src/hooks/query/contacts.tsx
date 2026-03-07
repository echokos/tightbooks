import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { castArray } from 'lodash';
import {
  fetchContact,
  fetchContactsAutoComplete,
  activateContact,
  inactivateContact,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { useAuthOrganizationId } from '../state';
import t from './types';

// Common invalidate queries.
const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.VENDORS] });
  queryClient.invalidateQueries({ queryKey: [t.CUSTOMERS] });
};

/** Contact (customer) payload returned for form/duplicate use */
type ContactData = Record<string, unknown>;

/**
 * Retrieve the contact by ID (for duplicate/form).
 */
export function useContact(
  id: number | string | undefined | null,
  props?: Omit<UseQueryOptions<ContactData>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  const organizationId = useAuthOrganizationId();
  const contactId = id != null ? Number(id) : 0;

  return useQuery({
    queryKey: [...castArray(t.CONTACT), contactId, organizationId],
    queryFn: () => fetchContact(fetcher, contactId),
    enabled: contactId > 0,
    ...props,
  });
}

/**
 * Retrieve the auto-complete contacts.
 */
export function useAutoCompleteContacts(
  props?: Omit<UseQueryOptions<Awaited<ReturnType<typeof fetchContactsAutoComplete>>>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  const organizationId = useAuthOrganizationId();

  return useQuery({
    queryKey: [t.CONTACTS, 'AUTO-COMPLETE', organizationId],
    queryFn: () => fetchContactsAutoComplete(fetcher),
    ...props,
  });
}

/**
 * Activate the given Contact.
 */
export function useActivateContact(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => activateContact(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.CONTACT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Inactivate the given contact.
 */
export function useInactivateContact(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => inactivateContact(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.CONTACT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}
