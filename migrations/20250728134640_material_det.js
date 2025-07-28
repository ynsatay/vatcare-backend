/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('material_det', function (table) {
    table.increments('id').primary(); // Detay kaydı ID

    table.integer('off_id').unsigned().notNullable(); // Şube ID
    table.integer('material_id').unsigned().notNullable()
         .references('id').inTable('materials')
         .onDelete('CASCADE');

    table.integer('pf_id').unsigned() // Tedarikçi firma ID (opsiyonel olabilir)
         .references('id').inTable('provider_firms')
         .onDelete('SET NULL');

    table.integer('invoice_id').unsigned(); // Fatura ID (isteğe bağlı)
    
    table.integer('quantity').notNullable(); // Alınan miktar
    table.decimal('unit_price', 10, 2).notNullable(); // Alış birim fiyatı
    table.decimal('tax_rate', 5, 2).defaultTo(0.0); // KDV oranı (örn: 18.00)

    table.date('purchase_date').notNullable(); // Alım tarihi
    table.text('note'); // Açıklama / not

    table.timestamps(true, true); // created_at, updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
