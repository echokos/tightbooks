// @ts-nocheck
import React from 'react';
import * as R from 'ramda';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { DRAWERS } from '@/constants/drawers';
import { CreateWorkspaceStepper } from './CreateWorkspaceStepper';

/**
 * Create workspace drawer content.
 */
function CreateWorkspaceDrawerContentRoot({ closeDrawer }) {
  const handleClose = () => {
    closeDrawer(DRAWERS.CREATE_WORKSPACE);
  };

  return <CreateWorkspaceStepper onClose={handleClose} />;
}

export const CreateWorkspaceDrawerContent = R.compose(withDrawerActions)(
  CreateWorkspaceDrawerContentRoot,
);
