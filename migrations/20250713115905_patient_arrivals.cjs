/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('patient_arrivals', table => {
        table.increments('id').primary();
        table.integer('u_id').notNullable();
        table.integer('animal_id').notNullable();
        table.integer('vet_u_id').notNullable();
        table.dateTime('ctime').nullable();
        table.integer('type').notNullable(); 
        table.integer('status').notNullable();
        table.string('notes').nullable();
        table.boolean('is_discharge').defaultTo(false);
        table.dateTime('discharge_time').nullable();
        table.string('arrival_reason').nullable();
        table.text('diagnosis').nullable();
        table.text('treatment_plan').nullable();
        table.integer('created_by').nullable();
        table.integer('clinic_id').nullable();
        table.timestamps(true, true);
    });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
