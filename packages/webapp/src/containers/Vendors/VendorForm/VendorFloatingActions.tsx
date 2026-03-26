// @ts-nocheck
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
import styled from 'styled-components';
import { useFormikContext } from 'formik';

import { Group, Icon, FormattedMessage as T } from '@/components';
import { useVendorFormContext } from './VendorFormProvider';

/**
 * Vendor floating actions bar.
 */
export function VendorFloatingActions() {
  // Formik context.
  const { resetForm, isSubmitting, submitForm } = useFormikContext();

  // Vendor form context.
  const { isNewMode, setSubmitPayload } = useVendorFormContext();

  // Handle the submit button.
  const handleSubmitBtnClick = () => {
    setSubmitPayload({ noRedirect: false });
  };

  // Handle the submit & new button click.
  const handleSubmitAndNewClick = () => {
    submitForm();
    setSubmitPayload({ noRedirect: true });
  };

  // Handle clear button click.
  const handleClearBtnClick = () => {
    resetForm();
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
