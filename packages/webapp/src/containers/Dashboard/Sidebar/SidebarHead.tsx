// @ts-nocheck
import { withCurrentOrganization } from '@/containers/Organization/withCurrentOrganization';
import { useAuthenticatedAccount } from '@/hooks/query';
import { compose } from '@/utils';

/**
 * Sidebar head.
 */
function SidebarHeadJSX({
  // #withCurrentOrganization
  organization,
}) {
  // Retrieve authenticated user information.
  const { data: user } = useAuthenticatedAccount();

  return (
    <div className="sidebar__head">
      <div className="sidebar__head-organization">
        <div className="title">{organization.name}</div>
        <span class="subtitle">{user.full_name}</span>
      </div>

      <div className="sidebar__head-logo">
        <span className="bigcapital--alt">BC</span>
      </div>
    </div>
  );
}

export const SidebarHead = compose(
  withCurrentOrganization(({ organization }) => ({ organization })),
)(SidebarHeadJSX);
