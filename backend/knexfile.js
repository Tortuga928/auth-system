/**
 * Knex configuration for database migrations
 */

require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb',
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};
