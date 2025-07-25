/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('material_invoice', function (table) {
    table.increments('id').primary();
    table.string('inv_no').unique().notNullable();     // Fatura numarası
    table.timestamp('inv_date').notNullable();              // Fatura tarihi
    table.integer('inv_type').notNullable();                // 1:Alım, 2:İade, 3:Çıkış 
    table.decimal('total_amount', 10, 2).notNullable();    // Toplam fatura tutarı
    table.timestamps(true, true);                          // created_at ve updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('material_invoice');
};
