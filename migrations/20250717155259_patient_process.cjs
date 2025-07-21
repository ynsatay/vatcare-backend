/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('patient_process', function(table) {
    table.increments('id').primary(); // ID
    table.integer('pa_id').unsigned().notNullable();// GELİŞ DOSYASI ID
    table.integer('process_id').unsigned().notNullable(); // İŞLEM ID
    table.enu('row_type', ['M', 'H']).notNullable(); // 'M': Malzeme, 'H': Hizmet
    table.integer('count').unsigned().notNullable().defaultTo(1); // KAÇ ADET
    table.decimal('total_prices', 10, 2).notNullable(); // TOPLAM TUTAR
    table.decimal('unit_prices', 10, 2).notNullable(); // BIRIM TUTARI
    table.timestamp('ctime').defaultTo(knex.fn.now()); // OLUŞTURULMA TARİHİ
    table.timestamp('ptime').nullable(); // İŞLEM TARİHİ / GÜNCELLEME TARİHİ
    table.text('note').nullable(); // NOT (opsiyonel)
    table.boolean('is_paid').defaultTo(false);
    
    // Opsiyonel takip alanları
    // table.integer('created_by').unsigned();
    // table.integer('updated_by').unsigned();
    // table.boolean('is_deleted').defaultTo(false);

    // İlişkisel bağlamlar için foreign key örnekleri:
    // table.foreign('pa_id').references('id').inTable('patient_arrivals').onDelete('CASCADE');
    // table.foreign('process_id').references('id').inTable('services').onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('patient_process');
};
