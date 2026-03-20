import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkspacesController } from './Workspaces.controller';
import { CreateWorkspaceService } from './commands/CreateWorkspace.service';
import { DeleteWorkspaceService } from './commands/DeleteWorkspace.service';
import { GetWorkspacesService } from './queries/GetWorkspaces.service';
import { GetWorkspaceBuildJobService } from './queries/GetWorkspaceBuildJob.service';
import { CreateUserTenantOnSignupSubscriber } from './subscribers/CreateUserTenantOnSignup.subscriber';
import { OrganizationBuildQueue } from '@/modules/Organization/Organization.types';
import { InjectSystemModel } from '@/modules/System/SystemModels/SystemModels.module';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { TenantDBManagerModule } from '@/modules/TenantDBManager/TenantDBManager.module';
import { GetBuildOrganizationBuildJob } from '@/modules/Organization/commands/GetBuildOrganizationJob.service';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';

@Module({
  imports: [
    BullModule.registerQueue({ name: OrganizationBuildQueue }),
    TenantDBManagerModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    InjectSystemModel(UserTenant),
    TenantRepository,
    CreateWorkspaceService,
    DeleteWorkspaceService,
    GetWorkspacesService,
    GetWorkspaceBuildJobService,
    CreateUserTenantOnSignupSubscriber,
    GetBuildOrganizationBuildJob,
  ],
})
export class WorkspacesModule {}
