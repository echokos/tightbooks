// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import {
  Button,
  Checkbox,
  Spinner,
  Intent,
  Tag,
  Tooltip,
  Position,
  Icon,
} from '@blueprintjs/core';
import { DataTable, TableSkeletonRows } from '@/components';
import { useWorkspaces, useSetDefaultWorkspace } from '@/hooks/query';
import { useAuthOrganizationId } from '@/hooks/state';
import { useSwitchOrganization } from '@/hooks/useSwitchOrganization';
import { firstLettersArgs, compose } from '@/utils';
import { WorkspaceSwitchingOverlay } from '@/components';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import classNames from 'classnames';
import intl from 'react-intl-universal';

// Avatar background colors similar to workspace sidebar style
const AVATAR_COLORS = [
  '#4A90E2', // Blue
  '#7ED321', // Green
  '#F5A623', // Orange
  '#BD10E0', // Purple
  '#D0021B', // Red
  '#50E3C2', // Teal
  '#9013FE', // Violet
  '#417505', // Dark Green
  '#B8E986', // Light Green
  '#F8E71C', // Yellow
  '#8B572A', // Brown
  '#9B9B9B', // Gray
];

/**
 * Get a deterministic color for an organization based on its name
 */
function getOrganizationColor(organizationId: string): string {
  let hash = 0;
  for (let i = 0; i < organizationId.length; i++) {
    const char = organizationId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Organizations list table component.
 */
function OrganizationsListTable({ workspaces, isLoading, onClose, openDialog }) {
  const activeOrganizationId = useAuthOrganizationId();
  const switchOrganization = useSwitchOrganization();
  const setDefaultWorkspace = useSetDefaultWorkspace();
  const [switchingWorkspaceName, setSwitchingWorkspaceName] = useState(null);

  const handleSwitchWorkspace = useCallback(
    (organizationId, workspaceName) => {
      if (organizationId === activeOrganizationId) {
        return;
      }
      setSwitchingWorkspaceName(workspaceName);
      onClose();
      setTimeout(() => {
        switchOrganization(organizationId, workspaceName);
      }, 350);
    },
    [activeOrganizationId, switchOrganization, onClose],
  );

  const handleSetDefault = useCallback(
    (organizationId) => {
      setDefaultWorkspace.mutate({ organizationId });
    },
    [setDefaultWorkspace],
  );

  const handleDeleteWorkspace = useCallback(
    (workspace) => {
      openDialog(DialogsName.WorkspaceDelete, {
        organizationId: workspace.organizationId,
        workspaceName: workspace.metadata?.name || workspace.organizationId,
      });
    },
    [openDialog],
  );

  const handleInactivateWorkspace = useCallback(
    (workspace) => {
      openDialog(DialogsName.WorkspaceInactivate, {
        organizationId: workspace.organizationId,
        workspaceName: workspace.metadata?.name || workspace.organizationId,
        isActive: workspace.isActive,
      });
    },
    [openDialog],
  );

  const columns = useMemo(
    () => [
      {
        Header: intl.get('name', { fallback: 'Account' }),
        accessor: 'metadata.name',
        width: 300,
        Cell: ({ row }) => {
          const workspace = row.original;
          const name = workspace.metadata?.name || workspace.organizationId;
          const initials = firstLettersArgs(...(name || '').split(' '));
          const isActive = workspace.organizationId === activeOrganizationId;
          const bgColor = getOrganizationColor(workspace.organizationId);

          return (
            <div className="organizations-list-table__name">
              <div
                className={classNames('organizations-list-table__avatar', {
                  'is-active': isActive,
                })}
                style={{ backgroundColor: bgColor }}
              >
                {workspace.isBuildRunning ? (
                  <Spinner size={14} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="organizations-list-table__name-text">
                <span className="organizations-list-table__name-label">{name}</span>
                {isActive && (
                  <Tag minimal intent={Intent.PRIMARY} className="organizations-list-table__current-tag">
                    {intl.get('workspaces.current_organization', { fallback: 'Current' })}
                  </Tag>
                )}
              </div>
            </div>
          );
        },
      },
      {
        Header: intl.get('assets_balance', { fallback: 'Assets Balance' }),
        accessor: 'balance',
        width: 150,
        Cell: ({ row }) => {
          const workspace = row.original;
          // Mock balance for now - in production this would come from the API
          const mockBalance = workspace.metadata?.name
            ? workspace.organizationId.charCodeAt(0) * 10000 + Math.random() * 50000
            : 0;

          return (
            <div className="organizations-list-table__balance">
              <span className="organizations-list-table__balance-amount">
                {formatCurrency(mockBalance)}
              </span>
            </div>
          );
        },
      },
      {
        Header: intl.get('total_income', { fallback: 'Total Income' }),
        accessor: 'totalIncome',
        width: 150,
        Cell: ({ row }) => {
          const workspace = row.original;
          const totalIncome = workspace.totalIncome ?? 0;

          return (
            <div className="organizations-list-table__income">
              <span className="organizations-list-table__income-amount">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          );
        },
      },
      {
        Header: intl.get('total_expenses', { fallback: 'Total Expenses' }),
        accessor: 'totalExpenses',
        width: 150,
        Cell: ({ row }) => {
          const workspace = row.original;
          const totalExpenses = workspace.totalExpenses ?? 0;

          return (
            <div className="organizations-list-table__expenses">
              <span className="organizations-list-table__expenses-amount">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          );
        },
      },
      {
        Header: intl.get('workspaces.default_workspace', { fallback: 'Default' }),
        accessor: 'isDefault',
        width: 80,
        Cell: ({ row }) => {
          const workspace = row.original;
          const isDisabled = !workspace.isReady || workspace.isBuildRunning || !workspace.isActive;

          return (
            <Tooltip
              content={intl.get('workspaces.set_as_default', { fallback: 'Set as default' })}
              position={Position.TOP}
              disabled={isDisabled}
            >
              <Checkbox
                checked={workspace.isDefault}
                disabled={isDisabled || workspace.isDefault}
                onChange={() => handleSetDefault(workspace.organizationId)}
                className="organizations-list-table__default-checkbox"
              />
            </Tooltip>
          );
        },
      },
      {
        Header: '',
        accessor: 'actions',
        width: 140,
        disableSortBy: true,
        Cell: ({ row }) => {
          const workspace = row.original;
          const isActiveOrg = workspace.organizationId === activeOrganizationId;
          const isDisabled = !workspace.isReady || workspace.isBuildRunning || workspace.isDeleting;
          const isOwner = workspace.role === 'owner';
          const canSwitch = !isDisabled && workspace.isActive;

          return (
            <div className="organizations-list-table__actions">
              {isOwner && (
                <>
                  <Tooltip
                    content={
                      workspace.isActive
                        ? intl.get('workspaces.inactivate_workspace', { fallback: 'Inactivate Workspace' })
                        : intl.get('workspaces.activate_workspace', { fallback: 'Activate Workspace' })
                    }
                    position={Position.TOP}
                  >
                    <Button
                      minimal
                      disabled={isDisabled}
                      onClick={() => handleInactivateWorkspace(workspace)}
                      className="organizations-list-table__inactivate-btn"
                      icon={<Icon
                        icon={workspace.isActive ? 'pause' : 'play'}
                        iconSize={16}
                        intent={workspace.isActive ? Intent.WARNING : Intent.SUCCESS}
                      />}
                    />
                  </Tooltip>
                  <Tooltip
                    content={intl.get('workspaces.delete_workspace', { fallback: 'Delete Workspace' })}
                    position={Position.TOP}
                  >
                    <Button
                      minimal
                      disabled={isDisabled}
                      onClick={() => handleDeleteWorkspace(workspace)}
                      className="organizations-list-table__delete-btn"
                      icon={<Icon icon="trash" iconSize={16} intent={Intent.DANGER} />}
                    />
                  </Tooltip>
                </>
              )}
              <Button
                minimal
                disabled={!canSwitch}
                onClick={() =>
                  handleSwitchWorkspace(workspace.organizationId, workspace.metadata?.name)
                }
                className="organizations-list-table__switch-btn"
                icon={<Icon icon="arrow-right" iconSize={20} />}
              />
            </div>
          );
        },
      },
    ],
    [activeOrganizationId, handleSwitchWorkspace, handleSetDefault, handleDeleteWorkspace, handleInactivateWorkspace],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={workspaces}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isLoading}
        TableLoadingRenderer={TableSkeletonRows}
        noInitialFetch={true}
        manualPagination={false}
        hidePaginationNoPages={true}
        pagination={false}
        className="organizations-list-table"
      />
      {switchingWorkspaceName && (
        <WorkspaceSwitchingOverlay workspaceName={switchingWorkspaceName} />
      )}
    </>
  );
}

export default compose(withDialogActions)(OrganizationsListTable);
