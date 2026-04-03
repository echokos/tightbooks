// @ts-nocheck
import React from 'react';
import { Tooltip, Position, Spinner } from '@blueprintjs/core';
import { useWorkspaces } from '@/hooks/query';
import { useAuthOrganizationId } from '@/hooks/state';
import { useSwitchOrganization } from '@/hooks/useSwitchOrganization';
import { firstLettersArgs } from '@/utils';
import classNames from 'classnames';

import '@/style/containers/Dashboard/WorkspacesSidebar.scss';

/**
 * Single workspace icon button.
 */
function WorkspaceIcon({ workspace, isActive, onClick }) {
  const name = workspace.metadata?.name || workspace.organizationId;
  const initials = firstLettersArgs(...(name || '').split(' '));
  const isDisabled = !workspace.isReady || workspace.isBuildRunning;

  return (
    <Tooltip
      content={name}
      position={Position.RIGHT}
      minimal
      className="workspaces-sidebar__item-tooltip"
    >
      <button
        className={classNames('workspaces-sidebar__item', {
          'is-active': isActive,
          'is-disabled': isDisabled,
        })}
        onClick={() => !isDisabled && onClick(workspace.organizationId)}
        disabled={isDisabled}
      >
        {workspace.isBuildRunning ? (
          <Spinner size={16} />
        ) : (
          <span className="workspaces-sidebar__item-initials">{initials}</span>
        )}
      </button>
    </Tooltip>
  );
}

/**
 * Workspaces sidebar container.
 */
export function WorkspacesSidebar() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeOrganizationId = useAuthOrganizationId();
  const switchOrganization = useSwitchOrganization();

  return (
    <div className="workspaces-sidebar">
      <div className="workspaces-sidebar__list">
        {isLoading ? (
          <div className="workspaces-sidebar__loading">
            <Spinner size={20} />
          </div>
        ) : (
          workspaces?.map((workspace) => (
            <WorkspaceIcon
              key={workspace.organizationId}
              workspace={workspace}
              isActive={workspace.organizationId === activeOrganizationId}
              onClick={switchOrganization}
            />
          ))
        )}
      </div>
    </div>
  );
}
