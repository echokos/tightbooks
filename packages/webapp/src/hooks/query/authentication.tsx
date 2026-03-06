import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { batch } from 'react-redux';
import {
  signin,
  signup,
  signupConfirm,
  sendResetPassword,
  resetPassword,
  fetchAuthMeta,
  resendSignupConfirm,
  type AuthSigninResponse,
  type AuthSigninBody,
  type AuthSignupBody,
  type AuthSignupVerifyBody,
  type AuthSendResetPasswordBody,
  type AuthResetPasswordBody,
  type AuthMetaResponse,
} from '@bigcapital/sdk-ts';
import { useAuthApiFetcher, useApiFetcher } from '../useRequest';
import { setCookie } from '../../utils';
import t from './types';
import {
  useSetAuthToken,
  useSetAuthUserId,
  useSetOrganizationId,
  useSetTenantId,
} from '../state';

/**
 * Saves the response data to cookies.
 */
export function setAuthLoginCookies(data: AuthSigninResponse): void {
  setCookie('token', data.accessToken ?? '');
  setCookie('authenticated_user_id', String(data.userId ?? ''));
  setCookie('organization_id', data.organizationId ?? '');
  setCookie('tenant_id', String(data.tenantId ?? ''));
}

export function useAuthLogin(
  props?: UseMutationOptions<
    AuthSigninResponse,
    Error,
    AuthSigninBody
  >
) {
  const fetcher = useAuthApiFetcher();
  const setAuthToken = useSetAuthToken();
  const setOrganizationId = useSetOrganizationId();
  const setUserId = useSetAuthUserId();
  const setTenantId = useSetTenantId();

  return useMutation({
    mutationFn: (values: AuthSigninBody) => signin(fetcher, values),
    onSuccess: (data, variables, context, mutation) => {
      setAuthLoginCookies(data);
      batch(() => {
        // @ts-ignore
        setAuthToken(data.access_token ?? '');
        // @ts-ignore
        setOrganizationId(data.organization_id ?? '');
        // @ts-ignore
        setTenantId(String(data.tenant_id ?? ''));
        // @ts-ignore
        setUserId(String(data.user_id ?? ''));
      });
      props?.onSuccess?.(data, variables, context, mutation);
    },
    ...props,
  });
}

export function useAuthRegister(
  props?: UseMutationOptions<unknown, Error, AuthSignupBody>
) {
  const fetcher = useAuthApiFetcher();

  return useMutation({
    mutationFn: (values: AuthSignupBody) => signup(fetcher, values),
    ...props,
  });
}

export function useAuthSendResetPassword(
  props?: UseMutationOptions<unknown, Error, AuthSendResetPasswordBody>
) {
  const fetcher = useAuthApiFetcher();

  return useMutation({
    mutationFn: (values: AuthSendResetPasswordBody) =>
      sendResetPassword(fetcher, values),
    ...props,
  });
}

export function useAuthResetPassword(
  props?: UseMutationOptions<
    unknown,
    Error,
    [token: string, values: AuthResetPasswordBody]
  >
) {
  const fetcher = useAuthApiFetcher();

  return useMutation({
    mutationFn: ([token, values]: [string, AuthResetPasswordBody]) =>
      resetPassword(fetcher, token, values),
    ...props,
  });
}

export function useAuthMetadata(
  props?: Omit<
    UseQueryOptions<AuthMetaResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const fetcher = useAuthApiFetcher();

  return useQuery({
    queryKey: [t.AUTH_METADATA_PAGE],
    queryFn: () => fetchAuthMeta(fetcher),
    select: (data) => data ?? ({} as AuthMetaResponse),
    ...props,
  });
}

export function useAuthSignUpVerifyResendMail(
  props?: UseMutationOptions<void, Error, void>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => resendSignupConfirm(fetcher),
    ...props,
  });
}

export function useAuthSignUpVerify(
  props?: UseMutationOptions<unknown, Error, AuthSignupVerifyBody>
) {
  const fetcher = useAuthApiFetcher();

  return useMutation({
    mutationFn: (values: AuthSignupVerifyBody) =>
      signupConfirm(fetcher, values),
    ...props,
  });
}
