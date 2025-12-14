exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('surname').notNullable();
    table.string('uname').notNullable();
    table.string('password').notNullable();
    table.integer('off_id').notNullable();
    table.string('phone').nullable();
    table.string('email').notNullable();
    table.string('sex').nullable();
    table.timestamp('birthdate').nullable();
    table.string('role').notNullable(); //1: hasta, 2: Veteriner, 3: Klinik yöneticisi
    table.string('address').nullable();
    table.longtext('picture').nullable();
    table.bigInteger('identity').nullable();  // Burada değişiklik
    table.integer('nationality').nullable();
    table.integer('pass_number').nullable();
    table.boolean('active').defaultTo(true);
    table.integer('language').notNullable().defaultTo(0); 
    table.boolean('dark_mode').notNullable().defaultTo(false); // Koyu mod durumu
    table.integer('theme').notNullable().defaultTo(1); // Tema varsayılan 1
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
