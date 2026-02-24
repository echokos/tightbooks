import { trpc } from '@/trpc';
import { useQueryClient } from '@tanstack/react-query';

// Query keys for cache invalidation
const accountQueryKeys = {
  accounts: ['accounts'],
  account: (id: number) => ['account', id],
  accountTypes: ['accountTypes'],
  accountTransactions: (id: number) => ['accountTransactions', id],
  cashFlowAccounts: ['cashFlowAccounts'],
  financialReport: ['financialReport'],
};

/**
 * Retrieve accounts list using tRPC.
 */
export function useAccountsTrpc(query?: Record<string, any>, options = {}) {
  return trpc.accounts.getAccounts.useQuery(query || {}, {
    select: (res) => res.accounts,
    ...options,
  });
}

/**
 * Retrieve the given account details using tRPC.
 */
export function useAccountTrpc(id: number, options = {}) {
  return trpc.accounts.getAccount.useQuery(
    { id },
    {
      enabled: !!id,
      ...options,
    }
  );
}

/**
 * Retrieve accounts types list using tRPC.
 */
export function useAccountsTypesTrpc(options = {}) {
  return trpc.accounts.getAccountTypes.useQuery(undefined, options);
}

/**
 * Retrieve account transactions using tRPC.
 */
export function useAccountTransactionsTrpc(
  accountId: number,
  filters?: { fromDate?: string; toDate?: string },
  options = {}
) {
  return trpc.accounts.getAccountTransactions.useQuery(
    {
      accountId,
      fromDate: filters?.fromDate,
      toDate: filters?.toDate,
    },
    {
      enabled: !!accountId,
      ...options,
    }
  );
}

/**
 * Creates account using tRPC.
 */
export function useCreateAccountTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.createAccount.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Edits the given account using tRPC.
 */
export function useEditAccountTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.editAccount.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({
        queryKey: accountQueryKeys.account(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Deletes the given account using tRPC.
 */
export function useDeleteAccountTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.deleteAccount.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Activates the given account using tRPC.
 */
export function useActivateAccountTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.activateAccount.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Inactivates the given account using tRPC.
 */
export function useInactivateAccountTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.inactivateAccount.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Validates which accounts can be deleted in bulk using tRPC.
 */
export function useValidateBulkDeleteAccountsTrpc(options = {}) {
  return trpc.accounts.validateBulkDeleteAccounts.useMutation(options);
}

/**
 * Deletes multiple accounts in bulk using tRPC.
 */
export function useBulkDeleteAccountsTrpc(options = {}) {
  const queryClient = useQueryClient();

  return trpc.accounts.bulkDeleteAccounts.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashFlowAccounts });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.financialReport });
    },
    ...options,
  });
}

/**
 * Hook to refresh accounts list.
 */
export function useRefreshAccountsTrpc() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.accounts });
    },
  };
}
