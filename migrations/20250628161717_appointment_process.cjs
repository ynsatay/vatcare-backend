/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
   return knex.schema.createTable('appointment_process', table => {
      table.increments('id').primary();
      table.integer('user_animal_id').notNullable();
      table.dateTime('process_date').notNullable();
      table.dateTime('start_time').notNullable();
      table.dateTime('end_time').notNullable();
      table.text('notes').nullable();
      table.integer('status').defaultTo(0); // 0: beklemede, 1: geldi, 2: tamamlandı, 3: iptal edildi
      table.integer('app_type').defaultTo(0); // 0: normal. Sonraki tipler ileride eklenebilir
      table.timestamps(true, true);
   });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
