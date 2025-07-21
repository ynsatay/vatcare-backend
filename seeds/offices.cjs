/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('hr_offices').del()
  await knex('hr_offices').insert([
    { id :1, clinic_id: '1', package_type: '1', Admin_id: '1', email: '1', phone: '1' },
    { id :2, clinic_id: '2', package_type: '2', Admin_id: '2', email: '2', phone: '2' }
  ]);
};
