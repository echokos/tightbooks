import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkspaceMetadataDto {
  @ApiProperty() name: string;
  @ApiProperty() baseCurrency: string;
  @ApiPropertyOptional() industry?: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() timezone?: string;
  @ApiPropertyOptional() language?: string;
}

export class WorkspaceDto {
  @ApiProperty() organizationId: string;
  @ApiProperty() isReady: boolean;
  @ApiProperty() isBuildRunning: boolean;
  @ApiPropertyOptional() buildJobId?: string;
  @ApiProperty() role: 'owner' | 'member';
  @ApiPropertyOptional() isDefault?: boolean;
  @ApiPropertyOptional({ type: WorkspaceMetadataDto })
  metadata?: WorkspaceMetadataDto;
}

export class CreateWorkspaceResponseDto {
  @ApiProperty() organizationId: string;
  @ApiProperty() jobId: string;
}
