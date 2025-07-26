/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('hr_offices', table => {
        table.increments('id').primary();
        table.integer('clinic_id').notNullable();
        table.integer('admin_id').notNullable();
        table.string('name').notNullable();
        table.string('email').notNullable();
        table.string('phone').notNullable();
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
