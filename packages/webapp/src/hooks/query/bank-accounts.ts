import {
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
  useMutation,
} from '@tanstack/react-query';
import {
  pauseBankAccount,
  resumeBankAccount,
  type PauseBankAccountParams,
  type ResumeBankAccountParams,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

/** Mutation variables for pause (hook uses bankAccountId for the API id). */
type PauseFeedsBankAccountValues = { bankAccountId: PauseBankAccountParams['id'] };

/**
 * Pauses the feeds syncing of the bank account.
 */
export function usePauseFeedsBankAccount(
  options?: UseMutationOptions<void, Error, PauseFeedsBankAccountValues>,
): UseMutationResult<void, Error, PauseFeedsBankAccountValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: PauseFeedsBankAccountValues) =>
      pauseBankAccount(fetcher, values.bankAccountId),
    onSuccess: (_res, values) => {
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT, values.bankAccountId] });
    },
    ...options,
  });
}

/** Mutation variables for resume (hook uses bankAccountId for the API id). */
type ResumeFeedsBankAccountValues = { bankAccountId: ResumeBankAccountParams['id'] };

/**
 * Resumes the feeds syncing of the bank account.
 */
export function useResumeFeedsBankAccount(
  options?: UseMutationOptions<void, Error, ResumeFeedsBankAccountValues>,
): UseMutationResult<void, Error, ResumeFeedsBankAccountValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: ResumeFeedsBankAccountValues) =>
      resumeBankAccount(fetcher, values.bankAccountId),
    onSuccess: (_res, values) => {
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT, values.bankAccountId] });
    },
    ...options,
  });
}
