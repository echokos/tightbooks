// @ts-nocheck
import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { DashboardCard, DashboardInsider } from '@/components';

import { CustomerFormFormik } from './CustomerFormFormik';
import {
  CustomerFormProvider,
  useCustomerFormContext,
} from './CustomerFormProvider';

/**
 * Customer form page loading.
 * @returns {JSX}
 */
function CustomerFormPageLoading({ children }) {
  const { isFormLoading } = useCustomerFormContext();

  return (
    <DashboardInsider loading={isFormLoading}>
      {children}
    </DashboardInsider>
  );
}

/**
 * Customer form page.
 * @returns {JSX}
 */
export default function CustomerFormPage() {
  const history = useHistory();
  const { id } = useParams();

  const customerId = parseInt(id, 10);

  // Handle the form submit success.
  const handleSubmitSuccess = (values, formArgs, submitPayload) => {
    if (!submitPayload.noRedirect) {
      history.push('/customers');
    }
  };
  // Handle the form cancel button click.
  const handleFormCancel = () => {
    history.goBack();
  };

  return (
    <CustomerFormProvider customerId={customerId}>
      <CustomerFormPageLoading>
          <CustomerFormFormik
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleFormCancel}
          />
      </CustomerFormPageLoading>
    </CustomerFormProvider>
  );
}