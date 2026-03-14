import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import type { AcceptInviteBody } from '@bigcapital/sdk-ts';
import { acceptInvite, fetchInviteCheck, resendInvite } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { transformToCamelCase } from '@/utils';
import { inviteKeys } from './query-keys';

/**
 * Authentication invite accept.
 */
export function useAuthInviteAccept(
  props?: UseMutationOptions<unknown, Error, [Record<string, unknown>, string]>
) {
  const fetcher = useApiFetcher();
  return useMutation({
    ...props,
    mutationFn: ([values, token]: [Record<string, unknown>, string]) =>
      acceptInvite(fetcher, token, values as AcceptInviteBody),
  });
}

/**
 * Retrieve the invite meta by the given token.
 */
export function useInviteMetaByToken(
  token: string | null | undefined,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: inviteKeys.meta(token),
    queryFn: () => fetchInviteCheck(fetcher, token!),
    enabled: !!token,
    select: (data) => transformToCamelCase(data as Record<string, unknown>),
  });
}

/**
 * Resend invitation to user.
 */
export function useResendInvitation(
  props?: UseMutationOptions<void, Error, number>
) {
  const fetcher = useApiFetcher();
  return useMutation({
    ...props,
    mutationFn: (userId: number) => resendInvite(fetcher, userId),
  });
}
