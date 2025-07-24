/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
bcrypt = require("bcrypt");
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  // await knex('users').del()
  // await knex('users').insert([
  //   {
  //       name : 'Emre',
  //       surname : 'Atay',
  //       uname : 'yatay', 
  //       password : bcrypt.hashSync('123456', 10),
  //       phone : '5462093705',
  //       email : 'ynmsratay@gmail.com',
  //       sex : 'ERKEK',
  //       birthdate : '1999-05-12',
  //       role: '3',
  //       address : 'İstanbul',
  //       active : '1' 

  //   },
  //   {
  //     name : 'Mehmet',
  //     surname : 'Can',
  //     uname : 'Mcan', 
  //     password : bcrypt.hashSync('123456', 10),
  //     phone : '5462093705',
  //     email : 'ynmsratay@gmail.com',
  //     sex : 'ERKEK',
  //     birthdate : '1999-05-12',
  //     role: '3',
  //     address : 'İstanbul',
  //     active : '1' 

  // }
  //    // 1 normal kullanıcı 2 Vet doktor hekim 3 admin
  //   // { name: 'yatay1', email: 'yatay@gmail.com', password: bcrypt.hashSync('123456', 10), role: '1' }
  // ]);
};