import React from 'react';
import { Spinner } from '@blueprintjs/core';
import { Features } from '@/constants';
import { useBranches } from '@/hooks/query';
import { useAccountsTrpc } from '@/hooks/trpc';
import { useFeatureCan } from '@/hooks/state';

interface MatchingReconcileTransactionBootProps {
  children: React.ReactNode;
}
interface MatchingReconcileTransactionBootValue {}

const MatchingReconcileTransactionBootContext =
  React.createContext<MatchingReconcileTransactionBootValue>(
    {} as MatchingReconcileTransactionBootValue,
  );

export function MatchingReconcileTransactionBoot({
  children,
}: MatchingReconcileTransactionBootProps) {
  // Detarmines whether the feature is enabled.
  const { featureCan } = useFeatureCan();
  const isBranchFeatureCan = featureCan(Features.Branches);

  const { data: accounts, isLoading: isAccountsLoading } = useAccountsTrpc();
  const { data: branches, isLoading: isBranchesLoading } = useBranches(
    {},
    {
      enabled: isBranchFeatureCan,
    },
  );

  const provider = {
    accounts,
    branches,
    isAccountsLoading,
    isBranchesLoading,
  };
  const isLoading = isAccountsLoading || isBranchesLoading;

  if (isLoading) {
    return <Spinner size={20} />;
  }

  return (
    <MatchingReconcileTransactionBootContext.Provider value={provider}>
      {children}
    </MatchingReconcileTransactionBootContext.Provider>
  );
}

export const useMatchingReconcileTransactionBoot = () =>
  React.useContext<MatchingReconcileTransactionBootValue>(
    MatchingReconcileTransactionBootContext,
  );
