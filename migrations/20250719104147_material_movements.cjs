/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('material_movements', function (table) {
    table.increments('id').primary();
    table.integer('mi_id').unsigned()
      .references('id').inTable('material_invoice')
      .onDelete('CASCADE');
    table.integer('pp_id').unsigned()
      .references('id').inTable('patient_process')
      .onDelete('CASCADE');
    table.integer('m_id').unsigned().notNullable()
      .references('id').inTable('materials') // materials tablosu varsa
      .onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.timestamp('movement_date').notNullable();
    table.integer('inv_type').notNullable(); // Analizler için tekrar
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('material_movements');
};
