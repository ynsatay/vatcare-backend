/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('materials', function(table) {
    table.increments('id').primary(); // Otomatik artan ID
    table.string('name').notNullable(); // Stok adı
    table.decimal('price', 10, 2).notNullable(); // Fiyat (örn: 125.50)
    table.integer('quantity').notNullable().defaultTo(0); // Stok adedi
    table.integer('unit').notNullable(); // Miktar birimi (örnek: kutu, adet)
    table.integer('category'); // Kategori (örnek: İlaç, Sarf)
    table.timestamp('expiration_date'); // Son kullanma tarihi (isteğe bağlı)
    table.integer('min_stock_level').defaultTo(0); // Minimum stok seviyesi
    table.string('barcode'); // Varsa barkod bilgisi
    table.string('supplier_name'); // Tedarikçi bilgisi (isteğe bağlı)
    table.text('description'); // Açıklama alanı (isteğe bağlı)
    
    table.timestamps(true, true); // created_at ve updated_at sütunları
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('materials');
};
