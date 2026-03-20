import { Inject, Injectable } from '@nestjs/common';
import { ServiceError } from '@/modules/Items/ServiceError';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { TenantModel } from '@/modules/System/models/TenantModel';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';
import { TenantDBManager } from '@/modules/TenantDBManager/TenantDBManager';

const ERRORS = {
  WORKSPACE_NOT_FOUND: 'WORKSPACE.NOT_FOUND',
  NOT_WORKSPACE_OWNER: 'NOT.WORKSPACE.OWNER',
};

@Injectable()
export class DeleteWorkspaceService {
  constructor(
    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,

    @Inject(TenantModel.name)
    private readonly tenantModel: typeof TenantModel,

    private readonly tenantRepository: TenantRepository,
    private readonly tenantDBManager: TenantDBManager,
  ) {}

  /**
   * Deletes a workspace (organization). Only the owner of the workspace
   * is permitted to delete it.
   * - Drops the physical tenant database.
   * - Deletes the tenant row (cascades to user_tenants).
   */
  async deleteWorkspace(userId: number, organizationId: string): Promise<void> {
    const tenant = await this.tenantModel.query().findOne({ organizationId });

    if (!tenant) {
      throw new ServiceError(ERRORS.WORKSPACE_NOT_FOUND);
    }
    const membership = await this.userTenantModel
      .query()
      .findOne({ userId, tenantId: tenant.id });

    if (!membership || membership.role !== 'owner') {
      throw new ServiceError(ERRORS.NOT_WORKSPACE_OWNER);
    }
    // Drop the physical tenant database if it exists.
    await this.tenantDBManager.dropDatabaseIfExists();

    // Delete the tenant row — cascades to user_tenants via FK.
    await this.tenantModel.query().deleteById(tenant.id);
  }
}
