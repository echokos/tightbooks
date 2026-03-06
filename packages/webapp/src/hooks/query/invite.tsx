import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import type { AcceptInviteBody } from '@bigcapital/sdk-ts';
import { acceptInvite, fetchInviteCheck, resendInvite } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';

/**
 * Authentication invite accept.
 */
export function useAuthInviteAccept(
  props?: UseMutationOptions<unknown, Error, [Record<string, unknown>, string]>
) {
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: ([values, token]: [Record<string, unknown>, string]) =>
      acceptInvite(fetcher, token, values as AcceptInviteBody),
    ...props,
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
    queryKey: ['INVITE_META', token],
    queryFn: () => fetchInviteCheck(fetcher, token!),
    enabled: !!token,
    select: (data) => transformToCamelCase(data as Record<string, unknown>),
    ...props,
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
    mutationFn: (userId: number) => resendInvite(fetcher, userId),
    ...props,
  });
}