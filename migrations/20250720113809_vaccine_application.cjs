/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('vaccine_application', (table) => {
    table.increments('id').primary();
    table.integer('animal_id').unsigned().notNullable()
      .references('id').inTable('users_animals').onDelete('CASCADE');
    table.integer('m_id').unsigned().notNullable()
      .references('id').inTable('materials').onDelete('CASCADE');
    table.date('applied_on').notNullable();
    table.integer('pa_id').unsigned().nullable()
      .references('id').inTable('patient_arrivals').onDelete('SET NULL');
    table.integer('plan_id').unsigned().nullable()
      .references('id').inTable('vaccination_plan').onDelete('SET NULL');
    table.integer('pp_id').unsigned().nullable()
      .references('id').inTable('patient_process').onDelete('SET NULL');
    table.text('notes').nullable();
    table.integer('created_by').unsigned()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('vaccine_application');
};
