exports.up = function (knex) {
  return knex.schema.table('tenant_users', (table) => {
    table.dropColumn('phone_number');
  });
};

exports.down = function (knex) {
  return knex.schema.table('tenant_users', (table) => {});
};
