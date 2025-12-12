import dotenv from 'dotenv';
import path from 'path';
import knex from 'knex';
import { fileURLToPath } from 'url';

// .env dosyasını otomatik yükle
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug log
console.log("MYSQLHOST:", process.env.MYSQLHOST);
console.log("MYSQLUSER:", process.env.MYSQLUSER);
console.log("MYSQLDB:", process.env.MYSQLDATABASE);
console.log("MYSQLPORT:", process.env.MYSQLPORT);

const connection = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT)
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.query("SET time_zone = '+03:00';", (err) => {
        done(err, conn);
      });
    }
  }
});

export default connection;
