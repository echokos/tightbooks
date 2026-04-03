// @ts-nocheck
import React from 'react';
import * as R from 'ramda';
import { Position } from '@blueprintjs/core';
import { Drawer, DrawerSuspense } from '@/components';
import { withDrawers } from '@/containers/Drawer/withDrawers';
import { CreateWorkspaceDrawerContent } from './CreateWorkspaceDrawerContent';

/**
 * Create workspace drawer.
 */
function CreateWorkspaceDrawerRoot({
  name,
  // #withDrawer
  isOpen,
  payload,
}) {
  return (
    <Drawer
      isOpen={isOpen}
      name={name}
      size={'600px'}
      position={Position.TOP}
      payload={payload}
    >
      <DrawerSuspense>
        <CreateWorkspaceDrawerContent />
      </DrawerSuspense>
    </Drawer>
  );
}

export const CreateWorkspaceDrawer = R.compose(withDrawers())(
  CreateWorkspaceDrawerRoot,
);
