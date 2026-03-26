// @ts-nocheck
import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box, DashboardCard, DashboardInsider } from '@/components';
import { CustomerFormFormik } from './CustomerFormFormik';
import {
  CustomerFormProvider,
  useCustomerFormContext,
} from './CustomerFormProvider';

/**
 * Customer form page.
 * @returns {JSX}
 */
export default function CustomerFormPage() {
  const history = useHistory();
  const { id } = useParams();
  const { isFormLoading } = useCustomerFormContext();

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
      <DashboardInsider loading={isFormLoading}>
        <Box mx={'auto'} maxWidth={800}>
          <CustomerFormFormik
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleFormCancel}
          />
        </Box>
      </DashboardInsider>
    </CustomerFormProvider>
  );
}