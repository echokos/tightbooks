// @ts-nocheck
import {
  Button,
  Popover,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
} from '@blueprintjs/core';

import { Icon, FormattedMessage as T } from '@/components';

import { withCurrentOrganization } from '@/containers/Organization/withCurrentOrganization';
import { useAuthenticatedAccount, useWorkspaces } from '@/hooks/query';
import { useAuthOrganizationId, useAuthActions } from '@/hooks/state';
import { useSwitchOrganization } from '@/hooks/useSwitchOrganization';
import { DRAWERS } from '@/constants/drawers';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { compose, firstLettersArgs } from '@/utils';

// Popover modifiers.
const POPOVER_MODIFIERS = {
  offset: { offset: '28, 8' },
};

/**
 * Sidebar head.
 */
function SidebarHeadJSX({
  // #withCurrentOrganization
  organization,
  // #withDrawerActions
  openDrawer,
}) {
  // Retrieve authenticated user information.
  const { data: user } = useAuthenticatedAccount();
  const { data: workspaces } = useWorkspaces();
  const currentOrganizationId = useAuthOrganizationId();
  const switchOrganization = useSwitchOrganization();
  const { setLogout } = useAuthActions();

  const handleSwitchWorkspace = (organizationId) => {
    if (organizationId === currentOrganizationId) {
      return;
    }
    switchOrganization(organizationId);
  };

  const handleLogout = () => {
    setLogout();
  };

  return (
    <div className="sidebar__head">
      <div className="sidebar__head-organization">
        <Popover
          modifiers={POPOVER_MODIFIERS}
          boundary={'window'}
          content={
            <Menu className={'menu--dashboard-organization'}>
              {/* Current Organization Header */}
              <div className="org-item org-item--current">
                <div className="org-item__logo">
                  {firstLettersArgs(...(organization.name || '').split(' '))}
                </div>
                <div className="org-item__name">{organization.name}</div>
              </div>

              <MenuDivider />

              {/* View All Workspaces */}
              <MenuItem
                icon={<Icon icon={'list'} size={16} />}
                text={
                  <T id={'workspaces.view_all_workspaces'} />
                }
                onClick={() => openDrawer(DRAWERS.ORGANIZATIONS_LIST)}
              />

              <MenuDivider />

              {/* Workspaces List */}
              <div className="org-workspaces-list">
                {workspaces?.map((workspace) => {
                  const name = workspace.metadata?.name || workspace.organizationId;
                  const initials = firstLettersArgs(...(name || '').split(' '));
                  const isActive = workspace.organizationId === currentOrganizationId;
                  const isDisabled = !workspace.isReady || workspace.isBuildRunning;

                  return (
                    <MenuItem
                      key={workspace.organizationId}
                      className={`org-workspace-item ${isActive ? 'is-active' : ''}`}
                      disabled={isDisabled}
                      onClick={() => handleSwitchWorkspace(workspace.organizationId)}
                      text={
                        <div className="org-workspace-item__content">
                          <div className="org-workspace-item__avatar">
                            {initials}
                          </div>
                          <span className="org-workspace-item__name">{name}</span>
                          {isActive && (
                            <Icon
                              icon={'tick'}
                              size={14}
                              className="org-workspace-item__check"
                            />
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </div>

              <MenuDivider />

              {/* Create Workspace */}
              <MenuItem
                icon={<Icon icon={'plus'} size={16} />}
                text={<T id={'workspaces.create_workspace'} />}
                onClick={() => openDrawer(DRAWERS.CREATE_WORKSPACE)}
              />

              {/* Log out */}
              <MenuItem
                icon={<Icon icon={'log-out'} size={16} />}
                text={<T id={'logout'} />}
                onClick={handleLogout}
              />
            </Menu>
          }
          position={Position.BOTTOM}
          minimal={true}
        >
          <Button
            className="title"
            rightIcon={<Icon icon={'caret-down-16'} size={16} />}
          >
            {organization.name}
          </Button>
        </Popover>
        <span class="subtitle">{user.full_name}</span>
      </div>

      <div className="sidebar__head-logo">
        <Icon
          icon={'mini-bigcapital'}
          width={28}
          height={28}
          className="bigcapital--alt"
        />
      </div>
    </div>
  );
}

export const SidebarHead = compose(
  withCurrentOrganization(({ organization }) => ({ organization })),
  withDrawerActions,
)(SidebarHeadJSX);
