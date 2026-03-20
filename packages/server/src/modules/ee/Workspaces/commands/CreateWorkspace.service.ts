import { Queue } from 'bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';
import {
  OrganizationBuildQueue,
  OrganizationBuildQueueJob,
  OrganizationBuildQueueJobPayload,
} from '@/modules/Organization/Organization.types';
import { transformBuildDto } from '@/modules/Organization/Organization.utils';
import { CreateWorkspaceDto } from '../dtos/CreateWorkspace.dto';
import { CreateWorkspaceResponseDto } from '../dtos/WorkspaceResponse.dto';

@Injectable()
export class CreateWorkspaceService {
  constructor(
    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,

    private readonly tenantRepository: TenantRepository,

    @InjectQueue(OrganizationBuildQueue)
    private readonly organizationBuildQueue: Queue,
  ) {}

  /**
   * Creates a new workspace (organization) for the authenticated user.
   * - Creates a new tenant row with a unique organizationId.
   * - Links the user as owner via user_tenants.
   * - Saves organization metadata.
   * - Enqueues the tenant database build job.
   */
  async createWorkspace(
    userId: number,
    dto: CreateWorkspaceDto,
  ): Promise<CreateWorkspaceResponseDto> {
    // Create the new tenant row.
    const tenant = await this.tenantRepository.createWithUniqueOrgId();

    // Link the authenticated user as the owner of this new workspace.
    await this.userTenantModel.query().insert({
      userId,
      tenantId: tenant.id,
      role: 'owner',
    });

    // Transform and persist the organization metadata.
    const transformedDto = transformBuildDto(dto);
    await this.tenantRepository.saveMetadata(tenant.id, transformedDto);

    // Enqueue the build job using the same queue and processor as the existing flow.
    const jobMeta = await this.organizationBuildQueue.add(
      OrganizationBuildQueueJob,
      {
        organizationId: tenant.organizationId,
        userId,
        buildDto: transformedDto,
      } as OrganizationBuildQueueJobPayload,
    );

    // Mark the tenant as currently building.
    await this.tenantRepository.markAsBuilding(jobMeta.id).findById(tenant.id);

    return {
      organizationId: tenant.organizationId,
      jobId: jobMeta.id,
    };
  }
}
