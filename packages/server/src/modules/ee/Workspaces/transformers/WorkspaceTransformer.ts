import { Transformer } from '@/modules/Transformer/Transformer';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { WorkspaceDto } from '../dtos/WorkspaceResponse.dto';

/**
 * Transforms UserTenant (workspace membership) to WorkspaceDto.
 */
export class WorkspaceTransformer extends Transformer<UserTenant> {
  private defaultTenantId?: number;

  /**
   * Include these attributes in the transformed output.
   */
  public includeAttributes = (): string[] => {
    return ['organizationId', 'isReady', 'isBuildRunning', 'buildJobId', 'role', 'metadata', 'isDefault'];
  };

  /**
   * Extract organizationId from tenant relation.
   */
  protected organizationId = (membership: UserTenant): string => {
    return membership.tenant?.organizationId;
  };

  /**
   * Extract isReady from tenant relation.
   */
  protected isReady = (membership: UserTenant): boolean => {
    return membership.tenant?.isReady ?? false;
  };

  /**
   * Extract isBuildRunning from tenant relation.
   */
  protected isBuildRunning = (membership: UserTenant): boolean => {
    return membership.tenant?.isBuildRunning ?? false;
  };

  /**
   * Extract buildJobId from tenant relation.
   */
  protected buildJobId = (membership: UserTenant): string | undefined => {
    return membership.tenant?.buildJobId ?? undefined;
  };

  /**
   * Transform metadata from tenant relation.
   */
  protected metadata = (membership: UserTenant) => {
    const metadata = membership.tenant?.metadata;
    if (!metadata) return undefined;

    return {
      name: metadata.name,
      baseCurrency: metadata.baseCurrency,
      industry: metadata.industry,
      location: metadata.location,
      timezone: metadata.timezone,
      language: metadata.language,
    };
  };

  /**
   * Determine if this workspace is the user's default.
   */
  protected isDefault = (membership: UserTenant): boolean => {
    if (!this.defaultTenantId) return false;
    return membership.tenantId === this.defaultTenantId;
  };

  /**
   * Transform single membership to WorkspaceDto.
   */
  transform = (membership: UserTenant, defaultTenantId?: number): WorkspaceDto => {
    this.defaultTenantId = defaultTenantId;
    return {
      organizationId: this.organizationId(membership),
      isReady: this.isReady(membership),
      isBuildRunning: this.isBuildRunning(membership),
      buildJobId: this.buildJobId(membership),
      role: membership.role,
      isDefault: this.isDefault(membership),
      metadata: this.metadata(membership),
    };
  };
}
