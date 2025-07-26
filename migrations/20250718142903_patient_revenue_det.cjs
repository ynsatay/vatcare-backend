/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('patient_revenue_det', table => {
    table.increments('id').primary(); // pr_id
    table.integer('revenue_id').notNullable().index(); // patient_revenues.id ile ilişki
    table.integer('pp_id').notNullable().index(); // patient_process.id ile ilişki
    table.decimal('amount', 10, 2).notNullable(); // tahsil edilen tutar
    table.integer('off_id').notNullable();
    table.text('note').nullable();
    table.timestamp('ctime').defaultTo(knex.fn.now()).notNullable();

    // İlişkiler (foreign key opsiyonel, önerilir)
    // table.foreign('revenue_id').references('id').inTable('patient_revenues').onDelete('CASCADE');
    // table.foreign('pp_id').references('id').inTable('patient_process').onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('patient_revenue_det');
};
