/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('clinic_date', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('dbname').nullable();
        table.string('dbpassword').notNullable();
        table.string('email').notNullable();
        table.string('phone').notNullable();
        table.integer('clinic_admin').notNullable();
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
