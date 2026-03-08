// register patient

import { UserStatus } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";

interface IRegisterPatientPayload {
  email: string;
  name: string;
  password: string;
}

interface ISignIn {
  email: string;
  password: string;
  callbackURL?: string;
}

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

  try {
    const patient = await prisma.$transaction(async (txx) => {
      const patientTxx = await txx.patient.create({
        data: {
          userId: data.user.id,
          name,
          email,
        },
      });
      return patientTxx;
    });
    return { ...data, patient };
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
          field: "Sign in patient",
          message: "Please, register a new account using new email account.",
        },
      ],
    );
  }

  return data;
};

export const authService = {
  registerPatient,
  signinPatient,
};
