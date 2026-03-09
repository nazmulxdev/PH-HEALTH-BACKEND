// register user

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { authService } from "./auth.service";
import AppResponse from "../../shared/AppResponse";
import { jwtTokenUtils } from "../../utils/token";

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

export const authController = {
  registerPatient,
  signinPatient,
};
