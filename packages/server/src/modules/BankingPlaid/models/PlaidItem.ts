import { BaseModel } from '@/models/Model';

export class PlaidItem extends BaseModel {
  pausedAt: Date;
  plaidAccessToken: string;
  lastCursor?: string;
  tenantId: number;
  plaidItemId: string;
  plaidInstitutionId: string;

  /**
   * Table name.
   * Renamed from 'plaid_items' to avoid conflict with the system DB 'plaid_items'
   * table when running in single-tenant mode with a shared database (TENANT_DB_NAME).
   */
  static get tableName() {
    return 'tenant_plaid_items';
  }

  /**
   * Timestamps columns.
   */
  get timestamps() {
    return [];
  }

  /**
   * Relationship mapping.
   */
  static get relationMappings() {
    return {};
  }

  /**
   * Virtual attributes.
   */
  static get virtualAttributes() {
    return ['isPaused'];
  }

  /**
   * Detarmines whether the Plaid item feeds syncing is paused.
   * @return {boolean}
   */
  get isPaused() {
    return !!this.pausedAt;
  }
}
