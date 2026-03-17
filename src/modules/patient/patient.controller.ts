import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";
import { IUpdatePatientProfilePayload } from "./patient.interface";
import { IRequestUser } from "../admin/admin.interface";
import { patientService } from "./patient.service";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as IUpdatePatientProfilePayload;
  const user = req.user as IRequestUser;

  console.log(payload);

  const result = await patientService.updateMyProfile(payload, user);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Patient profile updated successfully",
    data: result,
  });
});

export const patientController = {
  updateMyProfile,
};
