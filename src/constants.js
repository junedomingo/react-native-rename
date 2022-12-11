import * as dotenv from 'dotenv';

dotenv.config();

export const APP_PATH = process.env.DEV_APP_PATH || process.cwd();
export const VALID_APP_STORE_NAME_REGEX = /^[A-Za-z0-9\s\-._'+&]{2,}$/;
export const NON_ALPHANUMERIC_REGEX = /[^A-Za-z0-9]/g;
export const XML_ENTITIES_REGEX = /[&<>]/g;
export const PROMISE_DELAY = 200;
export const XML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};
