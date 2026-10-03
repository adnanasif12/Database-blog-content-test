import 'dotenv/config';
import { Sequelize } from 'sequelize';

const databaseName = process.env.DB_NAME || 'blogdb';

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_NAME may contain only letters, numbers, and underscores.');
}

const connectionOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
};

export const sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  connectionOptions,
);

export async function initDB() {
  const databaseBootstrap = new Sequelize(
    '',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    connectionOptions,
  );

  try {
    await databaseBootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await databaseBootstrap.close();
  }

  await sequelize.authenticate();
  const { Blog, User } = await import('./models/index.js');
  await sequelize.sync();
  return { Blog, User };
}

export async function closeDB() {
  await sequelize.close();
}
