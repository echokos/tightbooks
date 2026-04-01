import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { TenantAgnosticRoute } from '@/modules/Tenancy/TenancyGlobal.guard';
import { IgnoreUserVerifiedRoute } from '@/modules/Auth/guards/EnsureUserVerified.guard';
import { IgnoreTenantInitializedRoute } from '@/modules/Tenancy/EnsureTenantIsInitialized.guard';
import { IgnoreTenantSeededRoute } from '@/modules/Tenancy/EnsureTenantIsSeeded.guards';
import { IgnoreTenantModelsInitialize } from '@/modules/Tenancy/TenancyInitializeModels.guard';
import { CreateWorkspaceService } from './commands/CreateWorkspace.service';
import { DeleteWorkspaceService } from './commands/DeleteWorkspace.service';
import { GetWorkspacesService } from './queries/GetWorkspaces.service';
import { GetWorkspaceBuildJobService } from './queries/GetWorkspaceBuildJob.service';
import { CreateWorkspaceDto } from './dtos/CreateWorkspace.dto';
import {
  CreateWorkspaceResponseDto,
  WorkspaceDto,
} from './dtos/WorkspaceResponse.dto';
import { WorkspaceBuildJobResponseDto } from './dtos/WorkspaceBuildJobResponse.dto';

@ApiTags('Workspaces')
@Controller('workspaces')
@ApiExtraModels(WorkspaceDto, CreateWorkspaceResponseDto, WorkspaceBuildJobResponseDto)
export class WorkspacesController {
  constructor(
    private readonly createWorkspaceService: CreateWorkspaceService,
    private readonly deleteWorkspaceService: DeleteWorkspaceService,
    private readonly getWorkspacesService: GetWorkspacesService,
    private readonly getWorkspaceBuildJobService: GetWorkspaceBuildJobService,
    private readonly cls: ClsService,
  ) {}

  /**
   * Lists all organizations the authenticated user belongs to.
   * No `organization-id` header required.
   */
  @Get()
  @TenantAgnosticRoute()
  @IgnoreUserVerifiedRoute()
  @ApiOperation({ summary: 'List workspaces the authenticated user belongs to' })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of workspaces',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(WorkspaceDto) },
    },
  })
  async listWorkspaces(): Promise<WorkspaceDto[]> {
    const userId = this.cls.get<number>('userId');
    return this.getWorkspacesService.getWorkspaces(userId);
  }

  /**
   * Creates a new workspace (organization) for the authenticated user.
   * The organization database is built asynchronously via a background job.
   * No `organization-id` header required.
   */
  @Post()
  @TenantAgnosticRoute()
  @IgnoreUserVerifiedRoute()
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({
    status: 200,
    description: 'Returns the created workspace details',
    schema: {
      $ref: getSchemaPath(CreateWorkspaceResponseDto),
    },
  })
  async createWorkspace(
    @Body() dto: CreateWorkspaceDto,
  ): Promise<CreateWorkspaceResponseDto> {
    const userId = this.cls.get<number>('userId');
    return this.createWorkspaceService.createWorkspace(userId, dto);
  }

  /**
   * Deletes a workspace. Only the workspace owner is permitted to delete it.
   * Requires `organization-id` header (must match the path param).
   */
  @Delete(':organizationId')
  @IgnoreTenantInitializedRoute()
  @IgnoreTenantSeededRoute()
  @IgnoreTenantModelsInitialize()
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a workspace (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Workspace deleted successfully',
  })
  async deleteWorkspace(
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    const userId = this.cls.get<number>('userId');
    await this.deleteWorkspaceService.deleteWorkspace(userId, organizationId);
  }

  /**
   * Polls the build job status for a workspace being provisioned.
   * No `organization-id` header required.
   */
  @Get('build/:buildJobId')
  @TenantAgnosticRoute()
  @ApiOperation({ summary: 'Get workspace build job status' })
  @ApiResponse({
    status: 200,
    description: 'Returns the workspace build job details',
    schema: {
      $ref: getSchemaPath(WorkspaceBuildJobResponseDto),
    },
  })
  async buildJobStatus(@Param('buildJobId') buildJobId: string): Promise<WorkspaceBuildJobResponseDto> {
    return this.getWorkspaceBuildJobService.getJobDetails(buildJobId);
  }
}
