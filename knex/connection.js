import dotenv from 'dotenv';
import path from 'path';
import knex from 'knex';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT),
    timezone: 'Z',     // 🔥 UTC
    dateStrings: true
  },
  pool: {
    afterCreate: (conn, done) => {
      // 🔥 MySQL session'ı UTC yap
      conn.query("SET time_zone = '+00:00';", (err) => {
        done(err, conn);
      });
    }
  }
});

export default connection;
