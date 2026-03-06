import "dotenv/config";

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

const loadEEnvVariables = (): EnvConfig => {
  const requiredVariables = [
    "PORT",
    "DATABASE_URL",
    "NODE_ENV",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
  ];

  requiredVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(
        `Environment variable ${variable} is required but not set in the .env file.`,
      );
    }
  });
  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    NODE_ENV: process.env.NODE_ENV as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
  };
};

export const config = loadEEnvVariables();

// or  we can call them like function
