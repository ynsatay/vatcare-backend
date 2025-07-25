/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('vaccination_plan', (table) => {
    table.increments('id').primary();
    table.integer('animal_id').unsigned().notNullable()
      .references('id').inTable('users_animals').onDelete('CASCADE');
    table.integer('m_id').unsigned().notNullable()
      .references('id').inTable('materials').onDelete('CASCADE');
    table.date('planned_date').notNullable();
    table.boolean('is_applied').defaultTo(false);
    table.date('applied_on').nullable();
    table.text('notes').nullable();
    table.integer('pp_id').unsigned();
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
  return knex.schema.dropTableIfExists('vaccination_plan');
};
