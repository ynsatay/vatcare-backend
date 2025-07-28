import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Proje kök dizinindeki .env

const commonConfig = {
  client: 'mysql2',
  migrations: {
    tableName: 'migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.query("SET time_zone = '+00:00';", (err) => {
        done(err, conn);
      });
    }
  }
};

export default {
  development: {
    ...commonConfig,
    connection: {
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: Number(process.env.MYSQLPORT) || 3306,
    },
  },
  production: {
    ...commonConfig,
    connection: {
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: Number(process.env.MYSQLPORT) || 3306,
    },
  }
};
