// register user

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { authService } from "./auth.service";
import AppResponse from "../../shared/AppResponse";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authService.registerPatient(payload);

  AppResponse(res, {
    statusCode: 201,
    success: true,
    message: "Patient registered successfully.",
    data: result,
  });
});

const signinPatient = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authService.signinPatient(payload);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Patient sign in successfully.",
    data: result,
  });
});

export const authController = {
  registerPatient,
  signinPatient,
};
