// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import * as R from 'ramda';
import { debounce } from 'lodash';
import { FormGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { DRAWERS } from '@/constants/drawers';
import { useWorkspaces } from '@/hooks/query';
import { OrganizationsListTable } from './OrganizationsListTable';
import intl from 'react-intl-universal';

import '@/style/containers/Workspaces/OrganizationsListDrawer.scss';

/**
 * Organizations list drawer content.
 */
function OrganizationsListDrawerContentRoot({ closeDrawer, openDrawer }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: workspaces, isLoading } = useWorkspaces();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
    }, 200),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  const filteredWorkspaces = useMemo(() => {
    if (!debouncedSearch) return workspaces || [];
    const query = debouncedSearch.toLowerCase();
    return (workspaces || []).filter((workspace) =>
      workspace.metadata?.name?.toLowerCase().includes(query),
    );
  }, [workspaces, debouncedSearch]);

  const handleClose = () => {
    closeDrawer(DRAWERS.ORGANIZATIONS_LIST);
  };

  const handleCreateWorkspace = () => {
    closeDrawer(DRAWERS.ORGANIZATIONS_LIST);
    setTimeout(() => {
      openDrawer(DRAWERS.CREATE_WORKSPACE);
    }, 300);
  };

  return (
    <div className="organizations-list-drawer">
      <div className="organizations-list-drawer__header">
        <div className="organizations-list-drawer__header-left">
          <h3 className="organizations-list-drawer__title">
            {intl.get('workspaces.organizations_list_title', {
              fallback: 'Organizations',
            })}
          </h3>
          <span className="organizations-list-drawer__count">
            {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'organization' : 'organizations'}
          </span>
        </div>
        <Button
          intent={Intent.PRIMARY}
          icon="plus"
          onClick={handleCreateWorkspace}
          className="organizations-list-drawer__create-btn"
        >
          {intl.get('create_workspace', { fallback: 'Create Workspace' })}
        </Button>
      </div>

      <div className="organizations-list-drawer__toolbar">
        <FormGroup label={null} className="form-group--search">
          <InputGroup
            leftIcon="search"
            placeholder={intl.get('workspaces.search_organizations', {
              fallback: 'Search organizations...',
            })}
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-search"
          />
        </FormGroup>
      </div>

      <div className="organizations-list-drawer__content">
        <OrganizationsListTable
          workspaces={filteredWorkspaces}
          isLoading={isLoading}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}

export const OrganizationsListDrawerContent = R.compose(withDrawerActions)(
  OrganizationsListDrawerContentRoot,
);
