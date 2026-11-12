export const env = {
  PORT: process.env.PORT || 8002,
  DB_CONNECT_STRING: process.env.DB_CONNECT_STRING || "",
  NODE_ENV: process.env.NODE_ENV || "production",
  INIT: process.env.INIT || 0,

  /** Secret used to sign access tokens. Required in production. */
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "12h",

  /** Comma-separated list of allowed origins; empty disables CORS headers. */
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  /** Root account created when INIT=1 and no root exists (initial setup only). */
  ROOT_USERNAME: process.env.ROOT_USERNAME || "root",
  ROOT_PASSWORD: process.env.ROOT_PASSWORD || "",

  // Legacy values still referenced by the socket service and utils/sign.ts.
  SOCKET_PORT: process.env.SOCKET_PORT || 3000,
  KEY_SIGN: process.env.KEY_SIGN || "",
};
