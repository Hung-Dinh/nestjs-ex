module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : null,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // replication: {
  //   master: {
  //     host: process.env.DB_HOST,
  //     port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : null,
  //     username: process.env.DB_USER,
  //     password: process.env.DB_PASS,
  //     database: process.env.DB_NAME,
  //   },
  //   slaves: [
  //     {
  //       host: process.env.DB_SLAVE_1_HOST || process.env.DB_HOST,
  //       port: process.env.DB_SLAVE_1_PORT
  //         ? parseInt(process.env.DB_SLAVE_1_PORT, 10)
  //         : process.env.DB_PORT
  //         ? parseInt(process.env.DB_PORT, 10)
  //         : null,
  //       username: process.env.DB_SLAVE_1_USER || process.env.DB_USER,
  //       password: process.env.DB_SLAVE_1_PASS || process.env.DB_PASS,
  //       database: process.env.DB_SLAVE_1_NAME || process.env.DB_NAME,
  //     },
  //   ],
  // },
  charset: process.env.DB_CHARSET,
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  migrationsRun: false,
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'migrations',
  },
  // Timezone configured on the MySQL server.
  // This is used to typecast server date/time values to JavaScript Date object and vice versa.
  timezone: 'Z',
  synchronize: false,
  // debug: process.env.NODE_ENV === 'development' ? true : false,
};
