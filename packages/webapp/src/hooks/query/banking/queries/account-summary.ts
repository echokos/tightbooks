import { UseQueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query';
import type {
  AutofillCategorizeTransactionResponse,
  BankingAccountSummaryResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchAutofillCategorizeTransaction,
  fetchBankingAccountSummary,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../../useRequest';
import { transformToCamelCase } from '@/utils';
import { bankingKeys } from '../query-keys';

/** @deprecated Use AutofillCategorizeTransactionResponse from @bigcapital/sdk-ts */
export type GetAutofillCategorizeTransaction = AutofillCategorizeTransactionResponse;

export function useGetBankAccountSummaryMeta(
  bankAccountId: number,
  options?: UseQueryOptions<BankingAccountSummaryResponse, Error>
): UseQueryResult<BankingAccountSummaryResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: bankingKeys.summaryMeta(bankAccountId),
    queryFn: () =>
      fetchBankingAccountSummary(fetcher, bankAccountId).then(
        (data) =>
          transformToCamelCase(data as unknown as Record<string, unknown>) as BankingAccountSummaryResponse
      ),
  });
}

export function useGetAutofillCategorizeTransaction(
  uncategorizedTransactionIds: number[],
  options?: UseQueryOptions<AutofillCategorizeTransactionResponse, Error>
): UseQueryResult<AutofillCategorizeTransactionResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: bankingKeys.autofillCategorize(uncategorizedTransactionIds),
    queryFn: () =>
      fetchAutofillCategorizeTransaction(fetcher, uncategorizedTransactionIds).then(
        (data) =>
          transformToCamelCase(data as unknown as Record<string, unknown>) as AutofillCategorizeTransactionResponse
      ),
  });
}
