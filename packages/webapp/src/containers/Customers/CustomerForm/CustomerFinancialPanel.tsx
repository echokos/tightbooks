// @ts-nocheck
import React from 'react';
import { FormGroup, Position, ControlGroup } from '@blueprintjs/core';
import { ErrorMessage, useFormikContext } from 'formik';
import { Features } from '@/constants';
import {
  FFormGroup,
  FormattedMessage as T,
  InputPrependText,
  CurrencySelectList,
  BranchSelect,
  FeatureCan,
  Row,
  Col,
  FMoneyInputGroup,
  ExchangeRateInputGroup,
  FDateInput,
  Box,
} from '@/components';
import { useCustomerFormContext } from './CustomerFormProvider';
import {
  openingBalanceFieldShouldUpdate,
  useIsCustomerForeignCurrency,
  useSetPrimaryBranchToForm,
} from './utils';
import { useCurrentOrganization } from '@/hooks/state';
import CustomerFormSectionTitle from './CustomerFormSectionTitle';

/**
 * Customer financial panel.
 */
export default function CustomerFinancialPanel() {
  const { currencies, customerId, branches } = useCustomerFormContext();

  // Sets the primary branch to form.
  useSetPrimaryBranchToForm();

  return (
    <Box>
      <CustomerFormSectionTitle>
        <T id={'financial'} />
      </CustomerFormSectionTitle>
          {/*------------ Currency  -----------*/}
          <FFormGroup
            name={'currency_code'}
            label={<T id={'currency'} />}
            fastField
            inline
            fill
            >
            <CurrencySelectList
              name="currency_code"
              items={currencies}
              disabled={customerId}
              />
          </FFormGroup>

          {/*------------ Opening balance  -----------*/}
          <CustomerOpeningBalanceField />

          {/*------ Opening Balance Exchange Rate  -----*/}
          <CustomerOpeningBalanceExchangeRateField />

          {/*------------ Opening balance at -----------*/}
          <CustomerOpeningBalanceAtField />

          {/*------------ Opening branch  -----------*/}
          <FeatureCan feature={Features.Branches}>
            <FFormGroup
              label={<T id={'customer.label.opening_branch'} />}
              name={'opening_balance_branch_id'}
              inline
              fill
            >
              <BranchSelect
                name={'opening_balance_branch_id'}
                branches={branches}
                popoverProps={{ minimal: true }}
              />
            </FFormGroup>
          </FeatureCan>
              </Box>
  );
}

/**
 * Customer opening balance at date field.
 * @returns {JSX.Element}
 */
function CustomerOpeningBalanceAtField() {
  const { customerId } = useCustomerFormContext();

  // Cannot continue if the customer id is defined.
  if (customerId) return null;

  return (
    <FormGroup
      name={'opening_balance_at'}
      label={<T id={'opening_balance_at'} />}
      inline
      fill
      helperText={<ErrorMessage name="opening_balance_at" />}
    >
      <FDateInput
        name={'opening_balance_at'}
        popoverProps={{ position: Position.BOTTOM, minimal: true }}
        disabled={customerId}
        formatDate={(date) => date.toLocaleDateString()}
        parseDate={(str) => new Date(str)}
        fill={true}
      />
    </FormGroup>
  );
}

/**
 * Customer opening balance field.
 * @returns {JSX.Element}
 */
function CustomerOpeningBalanceField() {
  const { customerId } = useCustomerFormContext();
  const { values } = useFormikContext();

  // Cannot continue if the customer id is defined.
  if (customerId) return null;

  return (
    <FFormGroup
      label={<T id={'opening_balance'} />}
      name={'opening_balance'}
      inline
      fill
      shouldUpdate={openingBalanceFieldShouldUpdate}
      shouldUpdateDeps={{ currencyCode: values.currency_code }}
      fastField={true}
    >
      <ControlGroup fill>
        <InputPrependText text={values.currency_code} />
        <FMoneyInputGroup
          name={'opening_balance'}
          inputGroupProps={{ fill: true }}
        />
      </ControlGroup>
    </FFormGroup>
  );
}

/**
 * Customer opening balance exchange rate field if the customer has foreign
 * currency.
 * @returns {JSX.Element}
 */
function CustomerOpeningBalanceExchangeRateField() {
  const { values } = useFormikContext();
  const { customerId } = useCustomerFormContext();
  const currentOrganization = useCurrentOrganization();

  const isForeignJouranl = useIsCustomerForeignCurrency();

  // Can't continue if the customer is not foreign.
  if (!isForeignJouranl || customerId) {
    return null;
  }
  return (
    <FFormGroup
      label={' '}
      name={'opening_balance_exchange_rate'}
      inline
      fill
    >
      <ExchangeRateInputGroup
        fromCurrency={values.currency_code}
        toCurrency={currentOrganization.base_currency}
        name={'opening_balance_exchange_rate'}
      />
    </FFormGroup>
  );
}
