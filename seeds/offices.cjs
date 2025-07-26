/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Sadece id=1 kayıt yoksa ekle
  const exists = await knex('hr_offices').where({ id: 1 }).first();

  if (!exists) {
    await knex('hr_offices').insert([
      {
        id: 1,
        clinic_id: 1,
        admin_id: 1,
        email: 'admin@clinic.com',
        phone: '0123456789',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  }
};
