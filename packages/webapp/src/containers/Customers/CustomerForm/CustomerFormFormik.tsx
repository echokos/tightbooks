// @ts-nocheck
import React, { useMemo } from 'react';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { Formik, Form } from 'formik';
import { Divider, Intent, Tab, Tabs } from '@blueprintjs/core';
import styled from 'styled-components';

import { CLASSES } from '@/constants/classes';
import { CreateCustomerForm, EditCustomerForm } from './CustomerForm.schema';
import { compose, transformToForm, saveInvoke, parseBoolean } from '@/utils';
import { useCustomerFormContext } from './CustomerFormProvider';
import { defaultInitialValues } from './utils';
import { css } from '@emotion/css';

import { AppToaster, Box, Card, Group } from '@/components';
import CustomerFormPrimarySection from './CustomerFormPrimarySection';
import CustomerFormAfterPrimarySection from './CustomerFormAfterPrimarySection';
import CustomersTabs from './CustomersTabs';
import { CustomerFloatingActions } from './CustomerFloatingActions';

import { withCurrentOrganization } from '@/containers/Organization/withCurrentOrganization';
import CustomerFinancialPanel from './CustomerFinancialPanel';
import CustomerShippingAddress from './CustomerShippingAddress';
import CustomerBillingAddress from './CustomerBillingAddress';

function CustomerFormFormik({
  organization: { base_currency },

  // #ownProps
  initialValues: initialCustomerValues,
  onSubmitSuccess,
  onSubmitError,
  onCancel,
  className,
}) {
  const {
    customer,
    submitPayload,
    contactDuplicate,
    editCustomerMutate,
    createCustomerMutate,
    isNewMode,
  } = useCustomerFormContext();

  /**
   * Initial values in create and edit mode.
   */
  const initialValues = useMemo(
    () => ({
      ...defaultInitialValues,
      currency_code: base_currency,
      ...transformToForm(contactDuplicate || customer, defaultInitialValues),
      ...transformToForm(initialCustomerValues, defaultInitialValues),
    }),
    [customer, contactDuplicate, base_currency, initialCustomerValues],
  );

  // Handles the form submit.
  const handleFormSubmit = (values, formArgs) => {
    const { setSubmitting, resetForm } = formArgs;
    const formValues = {
      ...values,
      active: parseBoolean(values.active, true),
    };

    const onSuccess = (res) => {
      AppToaster.show({
        message: intl.get(
          isNewMode
            ? 'the_customer_has_been_created_successfully'
            : 'the_item_customer_has_been_edited_successfully',
        ),
        intent: Intent.SUCCESS,
      });
      setSubmitting(false);
      resetForm();
      saveInvoke(onSubmitSuccess, values, formArgs, submitPayload, res.data);
    };

    const onError = () => {
      setSubmitting(false);
      saveInvoke(onSubmitError, values, formArgs, submitPayload);
    };

    if (isNewMode) {
      createCustomerMutate(formValues).then(onSuccess).catch(onError);
    } else {
      editCustomerMutate([customer.id, formValues])
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <div
      className={classNames(CLASSES.PAGE_FORM, className)}
    >
      <Formik
        validationSchema={isNewMode ? CreateCustomerForm : EditCustomerForm}
        initialValues={initialValues}
        onSubmit={handleFormSubmit}
      >
        <Form>
          <CustomerFormFields>
            <Box px={'20px'} py={'10px'} mx={'auto'} maxWidth={'800px'}>
              <CustomerFormContent />
            </Box>
          </CustomerFormFields>
        </Form>
      </Formik>
    </div>
  );
}

const CustomerFormFields = styled.div`
  .bp4-form-content,
  .bp6-form-content {
    min-width: 300px;
  }

  .bp4-form-group.bp4-inline label.bp4-label {
    min-width: 140px;
  }
`;

export const CustomerFormHeaderPrimary = styled.div`
  --x-border: #e4e4e4;

  .bp4-dark & {
    --x-border: var(--color-dark-gray3);
  }
  padding: 10px 0 0;
  margin: 0 0 20px;
  overflow: hidden;
  border-bottom: 1px solid var(--x-border);
  max-width: 1000px;
`;

export default compose(withCurrentOrganization())(CustomerFormFormik);

function CustomerFormContent() {
  return (
    <Card>
      <Group verticalAlign={'top'} alignItems={'flex-start'} flexWrap={'nowrap'}>
          <Tabs vertical large defaultSelectedTabId={'primary'} className={css`position: sticky; top: 20px;`}>
            <Tab id={'primary'} title={'Basic'} />
            <Tab id={'financial'} title={'Financial'} />
            <Tab id={'billing_address'} title={'Billing address'} />
            <Tab id={'shipping_address'} title={'Ship address'} />
          </Tabs>

        <CustomerFormBasicSection />
      </Group>
        <CustomerFloatingActions />
    </Card>
  )
}


const customerFormSectionDividerClass = css`
  margin: 20px 0;
`;

function CustomerFormBasicSection() {
  return (
    <Box>
      <CustomerFormPrimarySection />
      <Divider className={customerFormSectionDividerClass} />
      <CustomerFinancialPanel />
      <Divider className={customerFormSectionDividerClass} />
      <CustomerBillingAddress />
      <Divider className={customerFormSectionDividerClass} />
      <CustomerShippingAddress />
    </Box>
  );
}


