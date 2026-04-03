// @ts-nocheck
import React from 'react';
import * as R from 'ramda';
import { Position } from '@blueprintjs/core';
import { Drawer, DrawerSuspense } from '@/components';
import { withDrawers } from '@/containers/Drawer/withDrawers';
import { OrganizationsListDrawerContent } from './OrganizationsListDrawerContent';

/**
 * Organizations list drawer.
 */
function OrganizationsListDrawerRoot({
  name,
  // #withDrawer
  isOpen,
  payload,
}) {
  return (
    <Drawer
      isOpen={isOpen}
      name={name}
      size={'100%'}
      position={Position.TOP}
      payload={payload}
    >
      <DrawerSuspense>
        <OrganizationsListDrawerContent />
      </DrawerSuspense>
    </Drawer>
  );
}

export const OrganizationsListDrawer = R.compose(withDrawers())(
  OrganizationsListDrawerRoot,
);
