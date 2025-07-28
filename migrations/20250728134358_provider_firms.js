/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('provider_firms', function (table) {
    table.increments('id').primary(); // Firma ID
    table.string('name').notNullable(); // Firma Adı
    table.string('contact_person'); // Kontak Kişi: Şimdilik kullanılmaycak.
    table.string('phone');
    table.string('email');
    table.text('address');
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
