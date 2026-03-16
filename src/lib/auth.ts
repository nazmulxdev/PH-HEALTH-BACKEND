import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../generated/prisma/enums";
import { config } from "../config/env";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      // callbackUrl: config.GOOGLE_CALLBACK_URL,

      mapProfileToUser: () => {
        return {
          role: Role.PATIENT,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          isDeleted: false,
          emailVerified: true,
          deletedAt: null,
        };
      },
    },
  },
  // redirectUrls: {
  //   signIn:
  // },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
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
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          // const isItFirstSuperAdmin=await prisma.user.findFirst({
          //   where:{
          //     role:Role.SUPER_ADMIN
          //   }
          // })

          if (
            (user && !user.emailVerified) ||
            user?.role !== Role.SUPER_ADMIN
          ) {
            sendEmail({
              to: email,
              subject: "Verify your email",
              templateName: "otp",
              templateData: {
                otp,
                name: user?.name,
              },
            });
          }
        } else if (type === "forget-password") {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (user) {
            sendEmail({
              to: email,
              subject: "Reset your password",
              templateName: "otp",
              templateData: {
                otp,
                name: user.name,
              },
            });
          }
        }
      },
      expiresIn: 120,
      otpLength: 6,
    }),
  ],
  session: {
    expiresIn: Number(config.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN),
    updateAge: Number(config.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE),
    cookieCache: {
      enabled: true,
      maxAge: Number(config.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN),
    },
  },
  trustedOrigins: [
    config.BETTER_AUTH_URL || "http://localhost:5000",
    config.FRONTEND_URL || "http://localhost:3000",
  ],

  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
