/**
 * In single-DB mode (TENANT_DB_NAME set), the system migration creates the
 * `users` table first.  When the tenant migration (20211112121920) then tries
 * to createTable('users') it fails silently because the table already exists,
 * leaving the tenant-specific columns — system_user_id, role_id, invited_at —
 * missing.  This migration adds them idempotently so both single-DB and
 * multi-DB installs converge to the same schema.
 */
exports.up = async (knex) => {
  const hasSystemUserId = await knex.schema.hasColumn('users', 'system_user_id');

  if (!hasSystemUserId) {
    await knex.schema.table('users', (table) => {
      table.integer('system_user_id').unsigned();
      table.integer('role_id').unsigned().references('id').inTable('roles');
      table.dateTime('invited_at').index();
    });
  }
};

exports.down = async (knex) => {
  const hasSystemUserId = await knex.schema.hasColumn('users', 'system_user_id');

  if (hasSystemUserId) {
    await knex.schema.table('users', (table) => {
      table.dropColumn('system_user_id');
      table.dropColumn('role_id');
      table.dropColumn('invited_at');
    });
  }
};
