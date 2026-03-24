// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import {
  Intent,
  Button,
  ButtonGroup,
  Popover,
  PopoverInteractionKind,
  Position,
  Menu,
  MenuItem,
} from '@blueprintjs/core';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import { Group, Icon, FormattedMessage as T } from '@/components';
import { CLASSES } from '@/constants/classes';
import { useCustomerFormContext } from './CustomerFormProvider';
import { safeInvoke } from '@/utils';

/**
 * Customer floating actions bar.
 */
export function CustomerFloatingActions({ onCancel }) {
  // Customer form context.
  const { isNewMode, setSubmitPayload } = useCustomerFormContext();

  // Formik context.
  const { resetForm, submitForm, isSubmitting } = useFormikContext();

  // Handle submit button click.
  const handleSubmitBtnClick = (event) => {
    setSubmitPayload({ noRedirect: false });
  };

  // Handle cancel button click.
  const handleCancelBtnClick = (event) => {
    safeInvoke(onCancel, event);
  };

  // handle clear button clicl.
  const handleClearBtnClick = (event) => {
    resetForm();
  };

  // Handle submit & new button click.
  const handleSubmitAndNewClick = (event) => {
    submitForm();
    setSubmitPayload({ noRedirect: true });
  };

  return (
    <FloatingActionsGroup spacing={10}>
      <ButtonGroup>
        {/* ----------- Save and New ----------- */}
        <SaveButton
          disabled={isSubmitting}
          loading={isSubmitting}
          intent={Intent.PRIMARY}
          type="submit"
          onClick={handleSubmitBtnClick}
          text={!isNewMode ? <T id={'edit'} /> : <T id={'save'} />}
        />
        <Popover
          content={
            <Menu>
              <MenuItem
                text={<T id={'save_and_new'} />}
                onClick={handleSubmitAndNewClick}
              />
            </Menu>
          }
          minimal={true}
          interactionKind={PopoverInteractionKind.CLICK}
          position={Position.BOTTOM_LEFT}
        >
          <Button
            disabled={isSubmitting}
            intent={Intent.PRIMARY}
            rightIcon={<Icon icon="arrow-drop-up-16" iconSize={20} />}
          />
        </Popover>
      </ButtonGroup>

      {/* ----------- Clear & Reset----------- */}
      <Button
        className={'ml1'}
        disabled={isSubmitting}
        onClick={handleClearBtnClick}
        text={!isNewMode ? <T id={'reset'} /> : <T id={'clear'} />}
      />
    </FloatingActionsGroup>
  );
}

const FloatingActionsGroup = styled(Group)`
  padding: 12px 0;
  padding-left: 165px;
  border-top: 1px solid #50555a;
  position: sticky;
  bottom: 0;
  background: var(--color-card-background);
`;

const SaveButton = styled(Button)`
  min-width: 80px;
`;
