/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Burada id=1 olan kayıt varsa eklemeyecek, yoksa ekleyecek

  const exists = await knex('clinic').where({ id: 1 }).first();

  if (!exists) {
    await knex('clinic').insert([
      {
        id: 1,
        name: 'Merkez Klinik',
        dbname: 'klinik',
        dbpassword: '1',
        email: 'klinik@example.com',
        phone: '0123456789',
        clinic_admin: 1,
        package_type: 2, // Örneğin Standart paket
        created_at: new Date(),
        updated_at: new Date(),
      },
      // İstersen diğer kayıtlar da eklenebilir
    ]);
  }
};
