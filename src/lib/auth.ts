import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../generated/prisma/enums";
import { config } from "../config/env";
import ms, { StringValue } from "ms";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.PATIENT,
      },

      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      needPasswordChange: {
        type: "boolean",
        defaultValue: false,
        required: true,
      },
      isDeleted: {
        type: "boolean",
        defaultValue: false,
        required: true,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },
  session: {
    expiresIn: Number(
      ms(config.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue) / 1000,
    ),
    updateAge: Number(
      ms(config.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE as StringValue) / 1000,
    ),
    cookieCache: {
      enabled: true,
      maxAge: Number(
        ms(config.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue) / 1000,
      ),
    },
  },
  // trustedOrigins: [config.better_auth_url || "http://localhost:5000"],

  // advanced: {
  //   disableCSRFCheck: true,
  // },
});
