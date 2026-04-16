import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { Role } from '../../../Roles/models/Role.model';

export class TenantUser extends TenantBaseModel {
  firstName!: string;
  lastName!: string;
  inviteAcceptedAt!: Date;
  invitedAt!: Date;
  roleId!: number;
  active!: boolean;
  role!: Role;
  email!: string;
  systemUserId!: number;

  /**
   * Table name.
   * Renamed from 'users' to avoid conflict with the system DB 'users' table
   * when running in single-tenant mode with a shared database (TENANT_DB_NAME).
   */
  static get tableName() {
    return 'tenant_users';
  }

  /**
   * Timestamps columns.
   */
  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * Virtual attributes.
   */
  static get virtualAttributes() {
    return ['isInviteAccepted', 'fullName'];
  }

  /**
   * Detarmines whether the user ivnite is accept.
   */
  get isInviteAccepted() {
    return !!this.inviteAcceptedAt;
  }

  /**
   * Full name attribute.
   */
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Relationship mapping.
   */
  static get relationMappings() {
    const { Role } = require('../../../Roles/models/Role.model');

    return {
      /**
       * User belongs to user.
       */
      role: {
        relation: Model.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: 'tenant_users.roleId',
          to: 'roles.id',
        },
      },
    };
  }
}
