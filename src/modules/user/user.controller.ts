import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { userService } from "./user.service";
import AppResponse from "../../shared/AppResponse";

const creteDoctor = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await userService.createDoctor(payload);
  AppResponse(res, {
    statusCode: 201,
    success: true,
    message: "Doctor created successfully",
    data: result,
  });
});

export const userController = {
  creteDoctor,
};
