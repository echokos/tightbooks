import { Inject, Injectable } from '@nestjs/common';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { WorkspaceDto } from '../dtos/WorkspaceResponse.dto';
import { WorkspaceTransformer } from '../transformers/WorkspaceTransformer';

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

    const transformer = new WorkspaceTransformer();
    return memberships.map((membership) => transformer.transform(membership));
  }
}
