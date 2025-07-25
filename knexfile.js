import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../.env') }); // .env dosyasının proje kökünde olduğundan emin ol

export default {
  development: {
    client: 'mysql2',
    timezone: 'local',
    connection: {
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: Number(process.env.MYSQLPORT) || 3306,
    },
    migrations: {
      tableName: 'migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
