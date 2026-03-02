import "dotenv/config";

const config = {
  port: process.env.PORT,
  db_url: process.env.DATABASE_URL,
};

export default config;
