/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('material_det', (table) => {
    table.increments('id').primary(); // Detay kaydı ID
    table.integer('off_id').unsigned().notNullable(); // Şube ID
    table.integer('m_id').unsigned().notNullable()
         .references('id').inTable('materials')
         .onDelete('CASCADE');
    table.integer('quantity').notNullable(); // Alınan miktar
    table.decimal('tax_rate', 5, 2).defaultTo(0.0); // KDV oranı (örn: 18.00)
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
