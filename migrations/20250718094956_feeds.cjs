/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("feeds", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned()
      .references("id").inTable("users")
      .onDelete("SET NULL")
      .nullable();
    table.integer('off_id').notNullable();
    table.string("title", 500).notNullable();
    table.string("icon").defaultTo("bi bi-info-circle");
    table.string("color").defaultTo("primary");
    table.timestamp("feed_date").notNullable(); // işlemle ilgili tarih
    table.string("reference_table").nullable();
    table.integer("reference_id").unsigned().nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists("feeds");
};
