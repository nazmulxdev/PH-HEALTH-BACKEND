// register user

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { authService } from "./auth.service";
import AppResponse from "../../shared/AppResponse";
import { jwtTokenUtils } from "../../utils/token";
import { AuthUser } from "../../types/express";
import AppError from "../../shared/AppError";
import { config } from "../../config/env";
import { auth } from "../../lib/auth";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authService.registerPatient(payload);

  const { accessToken, refreshToken, token, ...rest } = result;

  jwtTokenUtils.setAccessTokenCookie(res, accessToken);
  jwtTokenUtils.setRefreshTokenCookie(res, refreshToken);
  jwtTokenUtils.setBetterAuthSessionCookie(res, token as string);

  AppResponse(res, {
    statusCode: 201,
    success: true,
    message: "Patient registered successfully.",
    data: {
      accessToken,
      refreshToken,
      token,
      ...rest,
    },
  });
});

const signinPatient = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authService.signinPatient(payload);

  const { accessToken, refreshToken, token, ...rest } = result;

  jwtTokenUtils.setAccessTokenCookie(res, accessToken);
  jwtTokenUtils.setRefreshTokenCookie(res, refreshToken);
  jwtTokenUtils.setBetterAuthSessionCookie(res, token);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Patient sign in successfully.",
    data: {
      accessToken,
      refreshToken,
      token,
      ...rest,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;

  const result = await authService.getMe(user);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile fetched successfully.",
    data: result,
  });
});

// get new token by refresh token

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];

  if (!refreshToken || !betterAuthSessionToken) {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN", [
      {
        field: "Authentication",
        message: "Invalid refresh token",
      },
    ]);
  }

  const result = await authService.getNewToken(
    refreshToken,
    betterAuthSessionToken,
  );

  jwtTokenUtils.setAccessTokenCookie(res, result.accessToken);
  jwtTokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  jwtTokenUtils.setBetterAuthSessionCookie(res, result.token);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "New token generated successfully.",
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.token,
    },
  });
});

// change password

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const sessionToken = req.cookies["better-auth.session_token"];

  const result = await authService.changePassword(payload, sessionToken);

  const { accessToken, refreshToken, token } = result;

  jwtTokenUtils.setAccessTokenCookie(res, accessToken);
  jwtTokenUtils.setRefreshTokenCookie(res, refreshToken);
  jwtTokenUtils.setBetterAuthSessionCookie(res, token as string);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully.",
    data: result,
  });
});

// sign out user

const logOutUser = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.logOutUser(sessionToken);

  jwtTokenUtils.clearAllTokenFromCookies(res);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged out successfully.",
    data: result,
  });
});

// verify email

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await authService.verifyEmail(email, otp);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Email verified successfully.",
  });
});

// forget password

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgetPassword(email);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset link sent successfully.",
  });
});

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset successfully.",
  });
});

// google login (/api/v1/auth/login/google)
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirectPath as string) || "/";

  const encodedRedirectPath = encodeURIComponent(redirectPath);

  const callbackUrl = `${config.BETTER_AUTH_URL}/api/v1/auth/google/success?redirectPath=${encodedRedirectPath}`;

  res.render("googleRedirect", {
    callbackUrl,
    betterAuthUrl: config.BETTER_AUTH_URL,
  });
});

// google login success
const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirectPath as string) || "/";

  const sessionToken = req.cookies["better-auth.session_token"];

  if (!sessionToken) {
    return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const session = await auth.api.getSession({
    headers: new Headers({
      // Authorization: `Bearer ${sessionToken}`,,
      cookie: `better-auth.session_token=${sessionToken}`,
    }),
  });

  if (!session) {
    throw new AppError(404, "Session not found", "SESSION_NOT_FOUND", [
      {
        field: "User",
        message: "User not found",
      },
    ]);
  }

  if (session && !session.user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND", [
      {
        field: "User",
        message: "User not found",
      },
    ]);
  }

  const result = await authService.googleLoginSuccess(session);

  const { accessToken, refreshToken } = result;

  jwtTokenUtils.setAccessTokenCookie(res, accessToken);
  jwtTokenUtils.setRefreshTokenCookie(res, refreshToken);

  const isValidRedirectPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");

  const finalRedirectPath = isValidRedirectPath
    ? `${config.FRONTEND_URL}${redirectPath}`
    : `${config.FRONTEND_URL}/`;

  res.redirect(finalRedirectPath);
});

// handle oauth error
const handleOAuthError = catchAsync(async (req: Request, res: Response) => {
  const error = (req.query.error as string) || "oauth_failed";
  res.redirect(`${config.FRONTEND_URL}/login?error=${error}`);
});

export const authController = {
  registerPatient,
  signinPatient,
  getMe,
  getNewToken,
  changePassword,
  logOutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};
