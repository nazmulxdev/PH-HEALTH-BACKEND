import "dotenv/config";

const config = {
  port: process.env.PORT,
  db_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  better_auth_secret: process.env.BETTER_AUTH_SECRET,
  better_auth_url: process.env.BETTER_AUTH_URL,
};

export default config;
