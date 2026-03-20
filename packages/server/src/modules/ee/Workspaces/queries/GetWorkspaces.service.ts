import { Inject, Injectable } from '@nestjs/common';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { WorkspaceDto } from '../dtos/WorkspaceResponse.dto';

@Injectable()
export class GetWorkspacesService {
  constructor(
    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,
  ) {}

  /**
   * Returns all workspaces (organizations) the given user belongs to,
   * including their metadata and build status.
   */
  async getWorkspaces(userId: number): Promise<WorkspaceDto[]> {
    const memberships = await this.userTenantModel
      .query()
      .where('userId', userId)
      .withGraphFetched('tenant.metadata');

    return memberships.map((m) => ({
      organizationId: m.tenant.organizationId,
      isReady: m.tenant.isReady,
      isBuildRunning: m.tenant.isBuildRunning,
      buildJobId: m.tenant.buildJobId ?? undefined,
      role: m.role,
      metadata: m.tenant.metadata
        ? {
            name: m.tenant.metadata.name,
            baseCurrency: m.tenant.metadata.baseCurrency,
            industry: m.tenant.metadata.industry,
            location: m.tenant.metadata.location,
            timezone: m.tenant.metadata.timezone,
            language: m.tenant.metadata.language,
          }
        : undefined,
    }));
  }
}
