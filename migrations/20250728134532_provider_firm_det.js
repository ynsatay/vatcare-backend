/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('provider_firm_det', function (table) {
    table.increments('id').primary(); // Detay kaydı için ID
    table.integer('pf_id').unsigned().notNullable() // Provider firm ID
         .references('id').inTable('provider_firms')
         .onDelete('CASCADE');

    table.integer('material_id').unsigned().notNullable() // Malzeme ID
         .references('id').inTable('materials')
         .onDelete('CASCADE');

    table.decimal('purchase_price', 10, 2).notNullable(); // Alım fiyatı
    table.decimal('vat_rate', 5, 2).defaultTo(0.0); // KDV oranı (örn: 8.00, 18.00)
    table.boolean('is_default').defaultTo(false); // Varsayılan tedarikçi mi?
    table.boolean('active').defaultTo(true); // Aktif tedarik mi?
    table.timestamps(true, true); // created_at, updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
