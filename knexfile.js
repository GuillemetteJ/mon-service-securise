module.exports = {
  test: {
    client: 'sqlite3',
    connection: { filename: './mydb.sqlite' },
    useNullAsDefault: true,
  },

  development: {
    client: 'pg',
    connection: process.env.URL_SERVEUR_BASE_DONNEES,
    pool: { min: 2, max: 10 },
    migrations: { tableName: 'knex_migrations' },
  },

  production: {
    client: 'pg',
    connection: process.env.URL_SERVEUR_BASE_DONNEES,
    pool: { min: 2, max: 10 },
    migrations: { tableName: 'knex_migrations' },
  },
};
