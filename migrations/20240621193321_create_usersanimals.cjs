/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('users_animals', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.integer('animal_id').notNullable();
      table.integer('animal_species_id').notNullable();
      table.integer('off_id').notNullable();
      table.boolean('active').defaultTo(true);
      table.boolean('isdeath').defaultTo(false);     
      table.timestamp('birthdate').notNullable();
      table.timestamp('deathdate').nullable();
      table.string('animalidentnumber');
      table.longtext('picture').nullable();
      table.string('animalname').nullable();
      table.timestamps(true, true);
    });
  };
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
