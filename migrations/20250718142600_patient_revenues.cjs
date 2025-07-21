/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('patient_revenues', table => {
    table.increments('id').primary();
    table.integer('pa_id').notNullable().index();  // Hasta geliş dosyası id
    table.timestamp('ctime').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('ptime').nullable();
    table.integer('vet_u_id').notNullable().index(); // Tahsilatı yapan kullanıcı
    table.string('type', 50).notNullable(); // Tahsilat türü
    table.boolean('is_refund').defaultTo(false).notNullable(); // İade mi
    table.decimal('amount', 10, 2).notNullable(); // Tahsilat tutarı
    table.text('note').nullable();

    // İstersen foreign key olarak ilişki kurabilirsin, ben örnek verdim:
    // table.foreign('pa_id').references('id').inTable('patient_arrivals').onDelete('CASCADE');
    // table.foreign('vet_u_id').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('patient_revenues');
};
