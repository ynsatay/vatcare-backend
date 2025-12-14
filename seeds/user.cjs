const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Eğer id:1 kullanıcı yoksa ekle
  const exists = await knex('users').where({ id: 1 }).first();

  if (!exists) {
    await knex('users').insert([
      {
        id: 1,
        name: 'Emre',
        surname: 'Atay',
        uname: 'yatay',
        password: bcrypt.hashSync('123', 10),
        off_id: 1,               // zorunlu alan, ekledim
        phone: '5462093705',
        email: 'ynmsratay@gmail.com',
        sex: 'ERKEK',
        birthdate: '1999-05-12',
        role: '3',               // 1: hasta, 2: Veteriner, 3: Klinik yöneticisi
        address: 'İstanbul',
        active: true,            // boolean alana true
        created_at: new Date(),
        updated_at: new Date(),
        language: 1  
      }
    ]);
  }
};
