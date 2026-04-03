// @ts-nocheck
import React from 'react';
import { Formik, Form } from 'formik';
import { Button, Intent, Classes } from '@blueprintjs/core';
import { getAllCountries } from '@bigcapital/utils';
import { x } from '@xstyled/emotion';
import {
  FFormGroup,
  FInputGroup,
  FSelect,
  FTimezoneSelect,
  FormattedMessage as T,
  DrawerBody,
  DrawerActionsBar,
} from '@/components';
import { Col, Row } from '@/components';
import { useIsDarkMode } from '@/hooks/useDarkMode';
import { useCreateWorkspace } from '@/hooks/query';
import { getFiscalYear } from '@/constants/fiscalYearOptions';
import { getLanguages } from '@/constants/languagesOptions';
import { getAllCurrenciesOptions } from '@/constants/currencies';
import { getSetupOrganizationValidation } from '@/containers/Setup/SetupOrganization.schema';
import { transfromToSnakeCase } from '@/utils';

const countries = getAllCountries();

// Initial values.
const defaultValues = {
  name: '',
  location: '',
  baseCurrency: '',
  language: 'en',
  fiscalYear: '',
  timezone: '',
};

/**
 * Create workspace form.
 */
export default function CreateWorkspaceForm({ onSubmitting, onCancel }) {
  const FiscalYear = getFiscalYear();
  const Languages = getLanguages();
  const currencies = getAllCurrenciesOptions();
  const isDarkMode = useIsDarkMode();
  const { mutateAsync: createWorkspaceMutate } = useCreateWorkspace();
  const validationSchema = getSetupOrganizationValidation();

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const result = await createWorkspaceMutate({ ...transfromToSnakeCase(values) });
      setSubmitting(false);
      onSubmitting({
        organizationId: result.organizationId,
        jobId: result.jobId,
      });
    } catch (errors) {
      setSubmitting(false);
      if (errors?.response?.data?.errors) {
        setErrors(errors.response.data.errors);
      }
    }
  };

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={{ ...defaultValues }}
      onSubmit={handleSubmit}
    >
      {(formikProps) => (
        <>
          <DrawerBody>
            <x.div maxWidth={'600px'} w="100%" mx="auto" pt="30px" pb="20px" px="25px">
              <x.h3
                color={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#868f9f'}
                mb="2rem"
                fontWeight={600}
              >
                <T id={'create_new_workspace'} />
              </x.h3>

              <Form>
                {/* ---------- Organization name ----------  */}
                <FFormGroup name={'name'} label={<T id={'legal_organization_name'} />} fastField>
                  <FInputGroup name={'name'} large fastField />
                </FFormGroup>

                {/* ---------- Location ---------- */}
                <FFormGroup name={'location'} label={<T id={'business_location'} />} fastField={true}>
                  <FSelect
                    name={'location'}
                    items={countries}
                    valueAccessor={'countryCode'}
                    textAccessor={'name'}
                    placeholder={<T id={'select_business_location'} />}
                    popoverProps={{ minimal: true }}
                    buttonProps={{ large: true }}
                    fastField
                  />
                </FFormGroup>

                <Row>
                  <Col xs={6}>
                    {/* ----------  Base currency ----------  */}
                    <FFormGroup name={'baseCurrency'} label={<T id={'base_currency'} />} fastField={true}>
                      <FSelect
                        name={'baseCurrency'}
                        items={currencies}
                        popoverProps={{ minimal: true }}
                        valueAccessor={'key'}
                        textAccessor={'name'}
                        placeholder={<T id={'select_base_currency'} />}
                        buttonProps={{ large: true }}
                        fastField
                      />
                    </FFormGroup>
                  </Col>

                  {/* ---------- Language ---------- */}
                  <Col xs={6}>
                    <FFormGroup name={'language'} label={<T id={'language'} />} fastField>
                      <FSelect
                        name={'language'}
                        items={Languages}
                        valueAccessor={'value'}
                        textAccessor={'name'}
                        placeholder={<T id={'select_language'} />}
                        popoverProps={{ minimal: true }}
                        buttonProps={{ large: true }}
                        fastField
                      />
                    </FFormGroup>
                  </Col>
                </Row>

                {/* --------- Fiscal Year ----------- */}
                <FFormGroup name={'fiscalYear'} label={<T id={'fiscal_year'} />} fastField>
                  <FSelect
                    name={'fiscalYear'}
                    items={FiscalYear}
                    valueAccessor={'key'}
                    textAccessor={'name'}
                    placeholder={<T id={'select_fiscal_year'} />}
                    popoverProps={{ minimal: true }}
                    buttonProps={{ large: true }}
                    fastField
                  />
                </FFormGroup>

                {/* ----------  Time zone ----------  */}
                <FFormGroup name={'timezone'} label={<T id={'time_zone'} />}>
                  <FTimezoneSelect
                    name={'timezone'}
                    valueDisplayFormat="composite"
                    showLocalTimezone={true}
                    placeholder={<T id={'select_time_zone'} />}
                    popoverProps={{ minimal: true }}
                    buttonProps={{
                      alignText: 'left',
                      fill: true,
                      large: true,
                    }}
                  />
                </FFormGroup>

                <x.p
                  fontSize={14}
                  lineHeight="2.7rem"
                  mb={6}
                  borderBottom={`1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5'}`}
                  className={Classes.TEXT_MUTED}
                >
                  <T id={'setup.organization.note_you_can_change_your_preferences'} />
                </x.p>
              </Form>
            </x.div>
          </DrawerBody>

          <DrawerActionsBar>
            <x.div
              display="flex"
              justifyContent="flex-end"
              gap="10px"
              w="100%"
              maxWidth="600px"
              mx="auto"
              px="25px"
            >
              <Button onClick={onCancel}>
                <T id={'cancel'} />
              </Button>
              <Button
                intent={Intent.PRIMARY}
                loading={formikProps.isSubmitting}
                type="submit"
                onClick={formikProps.handleSubmit}
              >
                <T id={'create'} />
              </Button>
            </x.div>
          </DrawerActionsBar>
        </>
      )}
    </Formik>
  );
}
