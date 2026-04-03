import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultWorkspaceDto {
  @ApiProperty({ description: 'The organization ID to set as default' })
  organizationId: string;
}
