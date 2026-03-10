// @ts-nocheck
import React, { createContext, useContext } from 'react';
import { FinancialHeaderLoadingSkeleton } from '../FinancialHeaderLoadingSkeleton';
import { useCustomers } from '@/hooks/query';

const CustomersBalanceSummaryGeneralContext = createContext();

/**
 * Customers balance summary provider.
 */
function CustomersBalanceSummaryGeneralProvider({ ...props }) {
  // Fetches the customers list.
  const {
    data: customersData,
    isFetching: isCustomersFetching,
    isLoading: isCustomersLoading,
  } = useCustomers();

  const provider = {
    isCustomersLoading,
    isCustomersFetching,
    customers: customersData?.customers,
  };

  const loading = isCustomersLoading;

  return loading ? (
    <FinancialHeaderLoadingSkeleton />
  ) : (
    <CustomersBalanceSummaryGeneralContext.Provider
      value={provider}
      {...props}
    />
  );
}

const useCustomersBalanceSummaryGeneralContext = () =>
  useContext(CustomersBalanceSummaryGeneralContext);

export {
  CustomersBalanceSummaryGeneralProvider,
  useCustomersBalanceSummaryGeneralContext,
};
