/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
   return knex.schema.createTable('appointment_process', table => {
      table.increments('id').primary();
      table.integer('user_animal_id').notNullable();
      table.timestamp('process_date').notNullable(); 
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time').notNullable();
      table.integer('off_id').notNullable();
      table.text('notes').nullable();
      table.integer('status').defaultTo(0);
      table.integer('app_type').defaultTo(0);
      table.timestamps(true, true);
   });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
