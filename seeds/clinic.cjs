/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('clinic_date').del()
  await knex('clinic_date').insert([
    {id: 1, name: 'klinik', dbname: 'klinik', dbpassword: '1', email: 'klinik', phone: '1', clinic_admin: '1'},
  ]);
};
