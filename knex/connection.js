import dotenv from 'dotenv';
import path from 'path';
import knex from 'knex';

dotenv.config({ path: path.resolve('../.env') }); // Eğer .env api klasöründe değilse

const connection = knex({
  client: 'mysql',
  connection: {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
  },
  migrations: {
    tableName: 'migrations',
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
});

export default connection;
