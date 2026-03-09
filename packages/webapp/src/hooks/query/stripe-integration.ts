import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import type {
  GetStripeConnectLinkResponse,
  CreateStripeAccountLinkResponse,
  CreateStripeAccountSessionResponse,
  CreateStripeAccountResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchGetStripeConnectLink,
  fetchExchangeStripeOAuth,
  fetchCreateStripeAccountLink,
  fetchCreateStripeAccountSession,
  fetchCreateStripeAccount,
} from '@bigcapital/sdk-ts';

// Create Stripe Account Link
// ------------------------------------
interface StripeAccountLinkResponse {
  clientSecret: {
    created: number;
    expiresAt: number;
    object: string;
    url: string;
  };
}
interface StripeAccountLinkValues {
  stripeAccountId: string;
}

export const useCreateStripeAccountLink = (
  options?: UseMutationOptions<
    StripeAccountLinkResponse,
    Error,
    StripeAccountLinkValues
  >,
): UseMutationResult<
  StripeAccountLinkResponse,
  Error,
  StripeAccountLinkValues
> => {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: StripeAccountLinkValues) =>
      fetchCreateStripeAccountLink(fetcher, {
        stripeAccountId: values.stripeAccountId,
      }).then((data) => transformToCamelCase(data) as StripeAccountLinkResponse),
    ...options,
  });
};

// Create Stripe Account Session
// ------------------------------------
interface AccountSessionValues {
  connectedAccountId?: string;
}

export const useCreateStripeAccountSession = (
  options?: UseMutationOptions<
    CreateStripeAccountSessionResponse,
    Error,
    AccountSessionValues
  >,
): UseMutationResult<CreateStripeAccountSessionResponse, Error, AccountSessionValues> => {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: AccountSessionValues) =>
      fetchCreateStripeAccountSession(fetcher, {
        account: values?.connectedAccountId,
      }),
    ...options,
  });
};

// Create Stripe Account
// ------------------------------------
interface CreateStripeAccountValues {}

export const useCreateStripeAccount = (
  options?: UseMutationOptions<
    CreateStripeAccountResponse,
    Error,
    CreateStripeAccountValues
  >,
) => {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (_values: CreateStripeAccountValues) =>
      fetchCreateStripeAccount(fetcher),
    ...options,
  });
};

// Get Stripe Account OAuth Link
// ------------------------------------
export const useGetStripeAccountLink = (
  options?: UseQueryOptions<GetStripeConnectLinkResponse, Error>,
): UseQueryResult<GetStripeConnectLinkResponse, Error> => {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['getStripeAccountLink'],
    queryFn: () => fetchGetStripeConnectLink(fetcher),
    ...options,
  });
};

// Stripe Account OAuth Callback
// ------------------------------------
interface StripeAccountCallbackMutationValues {
  code: string;
}

interface StripeAccountCallbackMutationResponse {
  success: boolean;
}

export const useSetStripeAccountCallback = (
  options?: UseMutationOptions<
    StripeAccountCallbackMutationResponse,
    Error,
    StripeAccountCallbackMutationValues
  >,
): UseMutationResult<
  StripeAccountCallbackMutationResponse,
  Error,
  StripeAccountCallbackMutationValues
> => {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: StripeAccountCallbackMutationValues) =>
      fetchExchangeStripeOAuth(fetcher, { code: values.code }).then(
        () => ({ success: true }) as StripeAccountCallbackMutationResponse,
      ),
    ...options,
  });
};
