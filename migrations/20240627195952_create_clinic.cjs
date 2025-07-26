/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('clinic', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('dbname').nullable();
        table.string('dbpassword').notNullable();
        table.string('email').notNullable();
        table.string('phone').notNullable();
        table.integer('clinic_admin').notNullable();
        table.integer('package_type').nullable(); // Örn: 1=Başlangıç, 2 = Standart, 3 = Profesyonel
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
