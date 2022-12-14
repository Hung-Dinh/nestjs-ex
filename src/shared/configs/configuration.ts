export default (): any => ({
  env: process.env.APP_ENV,
  port: process.env.APP_PORT,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    charset: process.env.DB_CHARSET,
  },
  database_slaves: [
    {
      host: process.env.DB_SLAVE_1_HOST || process.env.DB_HOST,
      port: process.env.DB_SLAVE_1_PORT
        ? parseInt(process.env.DB_SLAVE_1_PORT, 10)
        : process.env.DB_PORT
        ? parseInt(process.env.DB_PORT, 10)
        : null,
      name: process.env.DB_SLAVE_1_NAME || process.env.DB_NAME,
      user: process.env.DB_SLAVE_1_USER || process.env.DB_USER,
      pass: process.env.DB_SLAVE_1_PASS || process.env.DB_PASS,
      charset: process.env.DB_CHARSET,
    },
  ],
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  },
  jwt: {
    publicKey: Buffer.from(
      process.env.JWT_PUBLIC_KEY_BASE64,
      'base64',
    ).toString('utf8'),
    privateKey: Buffer.from(
      process.env.JWT_PRIVATE_KEY_BASE64,
      'base64',
    ).toString('utf8'),
    accessTokenExpiresInSec: parseInt(
      process.env.JWT_ACCESS_TOKEN_EXP_IN_SEC,
      10,
    ),
    refreshTokenExpiresInSec: parseInt(
      process.env.JWT_REFRESH_TOKEN_EXP_IN_SEC,
      10,
    ),
  },
  defaultApiKey: process.env.DEFAULT_API_KEY,
  defaultAdminUserPassword: process.env.DEFAULT_ADMIN_USER_PASSWORD,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },
});
