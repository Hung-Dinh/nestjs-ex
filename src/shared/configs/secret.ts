import * as dotenv from 'dotenv';

dotenv.config();

export const getEnv = (key: string, ignore = false): string => {
  const value = process.env[key];
  if (!ignore && value === undefined) {
    console.log(`[ENV] ${key} not found!`);
  }
  return value;
};

// REDIS
export const REDIS_HOST = getEnv('REDIS_HOST');
export const REDIS_PORT = getEnv('REDIS_PORT')
  ? parseInt(getEnv('REDIS_PORT'), 10)
  : 6379;
export const REDIS_PASSWORD = getEnv('REDIS_PASSWORD');

export const ETHERSCAN_API_KEY = getEnv('ETHERSCAN_API_KEY');

export const SERVER_ADDRESS = getEnv('SERVER_ADDRESS');

// aws
export const AWS_REGION = getEnv('AWS_REGION');
export const AWS_ENABLED = getEnv('AWS_ENABLED') === 'true';
export const KMS_ENABLED = getEnv('KMS_ENABLED') === 'true';
export const AWS_ACCESS_KEY_ID = getEnv('AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = getEnv('AWS_SECRET_ACCESS_KEY');
export const AWS_PUBLIC_BUCKET_NAME = getEnv('AWS_PUBLIC_BUCKET_NAME');
export const AWS_PRIVATE_BUCKET_NAME = getEnv('AWS_PRIVATE_BUCKET_NAME');

export const UPLOAD_STRATEGY = getEnv('UPLOAD_STRATEGY');

export const INFURA_PROJECT_ID = getEnv('INFURA_PROJECT_ID');
export const INFURA_PROJECT_SECRET = getEnv('INFURA_PROJECT_SECRET');
export const INFURA_PROTOCOL = getEnv('INFURA_PROTOCOL');
export const INFURA_HOST = getEnv('INFURA_HOST');
export const INFURA_PORT = getEnv('INFURA_PORT')
  ? parseInt(getEnv('INFURA_PORT'), 10)
  : 5001;

export const CHAT_NETWORK_CHAINIDS =
  getEnv('CHAT_NETWORK_CHAINIDS')
    ?.split(',') || [];
