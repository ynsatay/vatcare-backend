/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('services', function(table) {
    table.increments('id').primary(); // Otomatik artan ID
    table.string('name').notNullable(); // Hizmet adı (örnek: Aşı, Muayene)
    table.decimal('price', 10, 2).notNullable(); // Hizmet ücreti
    table.integer('category'); // Hizmetin ait olduğu kategori (isteğe bağlı)
    table.text('description'); // Açıklama veya detaylı bilgi (isteğe bağlı)
    
    table.timestamps(true, true); // created_at ve updated_at otomatik
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('services');
};
