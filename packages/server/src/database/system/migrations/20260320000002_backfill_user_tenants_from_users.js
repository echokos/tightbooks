exports.up = function (knex) {
  return knex.raw(`
    INSERT IGNORE INTO user_tenants (user_id, tenant_id, role, created_at, updated_at)
    SELECT id, tenant_id, 'owner', NOW(), NOW()
    FROM   users
    WHERE  tenant_id IS NOT NULL
  `);
};

exports.down = function () {
  // Cannot safely reverse a backfill.
  return Promise.resolve();
};
