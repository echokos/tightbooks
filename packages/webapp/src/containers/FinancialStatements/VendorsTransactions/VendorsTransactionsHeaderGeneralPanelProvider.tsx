// @ts-nocheck
import React, { createContext, useContext } from 'react';
import { useVendors } from '@/hooks/query';
import { FinancialHeaderLoadingSkeleton } from '../FinancialHeaderLoadingSkeleton';

const VendorsTransactionsGeneralPanelContext = createContext();

/**
 * Vendors transactions provider.
 */
function VendorsTransactionsGeneralPanelProvider({ ...props }) {
  // Fetch vendors list based on the given query.
  const {
    data: vendorsData,
    isLoading: isVendorsLoading,
    isFetching: isVendorsFetching,
  } = useVendors({ page_size: 100000 });

  const provider = {
    vendors: vendorsData?.vendors,
    isVendorsLoading,
    isVendorsFetching,
  };

  const loading = isVendorsLoading;

  return loading ? (
    <FinancialHeaderLoadingSkeleton />
  ) : (
    <VendorsTransactionsGeneralPanelContext.Provider
      value={provider}
      {...props}
    />
  );
}

const useVendorsTransactionsGeneralPanelContext = () =>
  useContext(VendorsTransactionsGeneralPanelContext);

export {
  VendorsTransactionsGeneralPanelProvider,
  useVendorsTransactionsGeneralPanelContext,
};
