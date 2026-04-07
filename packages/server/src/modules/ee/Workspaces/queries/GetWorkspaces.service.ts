import { Inject, Injectable } from '@nestjs/common';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { SystemUser } from '@/modules/System/models/SystemUser';
import { WorkspaceDto } from '../dtos/WorkspaceResponse.dto';
import { WorkspaceTransformer } from '../transformers/WorkspaceTransformer';
import { GetWorkspacesFinancialService } from './GetWorkspacesFinancial.service';

@Injectable()
export class GetWorkspacesService {
  constructor(
    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,
    @Inject(SystemUser.name)
    private readonly systemUserModel: typeof SystemUser,
    private readonly financialService: GetWorkspacesFinancialService,
  ) {}

  /**
   * Returns all workspaces (organizations) the given user belongs to,
   * including their metadata, build status, and financial data.
   * @param includeInactive - Whether to include inactive workspaces (default: false)
   * @param currentOrganizationId - Current org ID to sort first (only when includeInactive is false)
   */
  async getWorkspaces(
    userId: number,
    includeInactive: boolean = false,
    currentOrganizationId?: string,
  ): Promise<WorkspaceDto[]> {
    const memberships = await this.userTenantModel
      .query()
      .where('userId', userId)
      .withGraphFetched('tenant.metadata');

    // Get user's default tenant ID
    const user = await this.systemUserModel
      .query()
      .select('defaultTenantId')
      .where('id', userId)
      .first();

    const defaultTenantId = user?.defaultTenantId;

    // Fetch financial data for all workspaces
    const workspaceInfos = memberships.map((m) => ({
      tenantId: m.tenantId,
      organizationId: m.tenant?.organizationId,
      isReady: m.tenant?.isReady ?? false,
    }));

    const financialDataMap =
      await this.financialService.getWorkspacesFinancial(workspaceInfos);

    const transformer = new WorkspaceTransformer();
    let workspaces = memberships.map((membership) => {
      const financialData = financialDataMap.get(membership.tenantId);
      return transformer.transform(
        membership,
        defaultTenantId,
        financialData,
      );
    });

    // Filter out inactive workspaces unless includeInactive is true
    if (!includeInactive) {
      workspaces = workspaces.filter((w) => w.isActive);
    }

    // Sort: current organization first, then by name
    return workspaces.sort((a, b) => {
      if (currentOrganizationId) {
        if (a.organizationId === currentOrganizationId) return -1;
        if (b.organizationId === currentOrganizationId) return 1;
      }
      return (a.metadata?.name || a.organizationId).localeCompare(
        b.metadata?.name || b.organizationId,
      );
    });
  }
}
