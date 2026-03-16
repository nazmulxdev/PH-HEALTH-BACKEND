/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// register patient

import { JwtPayload } from "jsonwebtoken";
import { config } from "../../config/env";
import { UserStatus } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { AuthUser } from "../../types/express";
import { jwtUtils } from "../../utils/jwt";
import { jwtTokenUtils } from "../../utils/token";
import {
  IChangePasswordPayload,
  IRegisterPatientPayload,
  ISignIn,
} from "./auth.interface";

const registerPatient = async (payload: IRegisterPatientPayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!data.user) {
    throw new AppError(
      404,
      "Patient registration failed.",
      "REGISTRATION_FAILED",
      [
        {
          field: "Patient registration.",
          message: "Please, try again after a while.",
        },
      ],
    );
  }

  console.log(data);

  try {
    // const patient = await prisma.$transaction(async (txx) => {
    //   const patientTxx = await txx.patient.create({
    //     data: {
    //       userId: data.user.id,
    //       name,
    //       email,
    //     },
    //   });
    //   return patientTxx;
    // });

    const dbUser = await prisma.user.findUnique({
      where: {
        id: data.user.id,
      },
    });

    if (!dbUser) {
      throw new AppError(
        500,
        "User creation not synced yet",
        "USER_SYNC_ERROR",
        [
          {
            field: "user",
            message: "User not found in database",
          },
        ],
      );
    }

    const patient = await prisma.patient.create({
      data: {
        userId: data.user.id,
        name,
        email,
      },
    });

    const accessToken = jwtTokenUtils.getAccessToken({
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    const refreshToken = jwtTokenUtils.getRefreshToken({
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    return { ...data, accessToken, refreshToken, patient };
  } catch (error) {
    console.error(error);
    await prisma.user.delete({
      where: {
        id: data.user.id,
      },
    });
    throw error;
  }
};

// sign in patient

const signinPatient = async (payload: ISignIn) => {
  const { email, password, callbackURL } = payload;

  const data = await auth.api.signInEmail({
    body: {
      email,
      password,
      rememberMe: true,
      ...(callbackURL ? { callbackURL } : {}),
    },
  });

  if (data.user.status === UserStatus.BLOCKED) {
    throw new AppError(
      404,
      "User have been blocked by admin. Please , contact to the admin.",
      "USER_ID_BLOCKED",
      [
        {
          field: "Sign in patient",
          message:
            "Please, contact to the higher authority for again join use.",
        },
      ],
    );
  }

  if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    throw new AppError(
      404,
      "User have been deleted your account. Please , register again to join this platform.",
      "ACCOUNT_DELETED",
      [
        {
          field: "Sign in user.",
          message: "Please, register a new account using new email account.",
        },
      ],
    );
  }

  const accessToken = jwtTokenUtils.getAccessToken({
    userId: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  const refreshToken = jwtTokenUtils.getRefreshToken({
    userId: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  return { ...data, accessToken, refreshToken };
};

// get me

const getMe = async (user: AuthUser) => {
  const { userId } = user;

  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      patient: {
        include: {
          appointments: {
            include: {
              doctor: true,
            },
          },
          reviews: {
            include: {
              doctor: true,
            },
          },
          prescriptions: {
            include: {
              doctor: true,
            },
          },
          patientHealthData: true,
        },
      },
      admin: true,
      doctor: {
        include: {
          specialties: true,
          appointments: {
            include: {
              patient: true,
            },
          },
          reviews: {
            include: {
              patient: true,
            },
          },
          prescriptions: {
            include: {
              patient: true,
            },
          },
        },
      },
    },
  });

  if (!userData) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND", [
      {
        field: "User",
        message: "User not found",
      },
    ]);
  }

  return userData;
};

// get new token by refresh token

const getNewToken = async (
  refreshToken: string,
  betterAuthSessionToken: string,
) => {
  const isSessionTokenValid = await prisma.session.findUnique({
    where: {
      token: betterAuthSessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenValid) {
    throw new AppError(
      401,
      "Invalid better auth session token",
      "INVALID_BETTER_AUTH_SESSION_TOKEN",
      [
        {
          field: "Authentication",
          message: "Invalid better auth session token",
        },
      ],
    );
  }

  const verifyRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    config.REFRESH_TOKEN_SECRET,
  );

  if (!verifyRefreshToken.success && !verifyRefreshToken.decoded) {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN", [
      {
        field: "Authentication",
        message: "Invalid refresh token",
      },
    ]);
  }

  const { decoded: data } = verifyRefreshToken as JwtPayload;

  const newAccessToken = jwtTokenUtils.getAccessToken({
    userId: data?.userId,
    email: data?.email,
    name: data?.name,
    role: data?.role,
    status: data?.status,
    isDeleted: data?.isDeleted,
    emailVerified: data?.emailVerified,
  });

  const newRefreshToken = jwtTokenUtils.getRefreshToken({
    userId: data?.userId,
    email: data?.email,
    name: data?.name,
    role: data?.role,
    status: data?.status,
    isDeleted: data?.isDeleted,
    emailVerified: data?.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: {
      token: betterAuthSessionToken,
    },
    data: {
      token: betterAuthSessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, token };
};

// change password

const changePassword = async (
  payload: IChangePasswordPayload,
  sessionToken: string,
) => {
  const { currentPassword, newPassword } = payload;
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (!session) {
    throw new AppError(
      401,
      "Invalid session_token  provided",
      "INVALID_SESSION_TOKEN ",
      [
        {
          field: "Authentication",
          message: "Invalid session_token  provided",
        },
      ],
    );
  }

  const result = await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: session.user?.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  const accessToken = jwtTokenUtils.getAccessToken({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  const refreshToken = jwtTokenUtils.getRefreshToken({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return { accessToken, refreshToken, ...result };
};

// sign out

const logOutUser = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  return result;
};

// verify email

const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp,
    },
  });

  if (!result) {
    throw new AppError(401, "Invalid otp", "INVALID_OTP", [
      {
        field: "Authentication",
        message: "Invalid otp",
      },
    ]);
  }

  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({
      where: {
        id: result.user.id,
      },
      data: {
        emailVerified: true,
      },
    });
  }
};

//  forget  password
const forgetPassword = async (email: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (
    !isUserExist ||
    isUserExist.isDeleted ||
    isUserExist.status === UserStatus.DELETED
  ) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND", [
      {
        field: "User",
        message: "User not found",
      },
    ]);
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(401, "Email not verified", "EMAIL_NOT_VERIFIED", [
      {
        field: "User",
        message: "Email not verified",
      },
    ]);
  }
  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
};

//  reset password

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (
    !isExistUser ||
    isExistUser.isDeleted ||
    isExistUser.status === UserStatus.DELETED
  ) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND", [
      {
        field: "User",
        message: "User not found",
      },
    ]);
  }

  if (!isExistUser.emailVerified) {
    throw new AppError(401, "Email not verified", "EMAIL_NOT_VERIFIED", [
      {
        field: "User",
        message: "Email not verified",
      },
    ]);
  }

  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword,
    },
  });

  if (isExistUser.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: isExistUser.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  await prisma.session.deleteMany({
    where: {
      userId: isExistUser.id,
    },
  });
};

// google login success

const googleLoginSuccess = async (session: Record<string, any>) => {
  const isPatientExist = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!isPatientExist) {
    await prisma.patient.create({
      data: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  }

  const accessToken = jwtTokenUtils.getAccessToken({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  const refreshToken = jwtTokenUtils.getRefreshToken({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return { accessToken, refreshToken };
};
// handle oauth error

export const authService = {
  registerPatient,
  signinPatient,
  getMe,
  getNewToken,
  changePassword,
  logOutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};
