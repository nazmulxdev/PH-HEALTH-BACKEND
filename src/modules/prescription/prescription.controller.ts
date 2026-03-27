import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { IRequestUser } from "../admin/admin.interface";
import AppResponse from "../../shared/AppResponse";
import { prescriptionService } from "./prescription.service";

// catchAsync(async (req: Request, res: Response) => {});

const givePrescription = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreatePrescriptionPayload;

  const user = req.user as IRequestUser;

  const result = await prescriptionService.givePrescription(user, payload);

  AppResponse(res, {
    statusCode: 201,
    success: true,
    message: "Prescription given successfully",
    data: result,
  });
});

const myPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await prescriptionService.myPrescriptions(user);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "My prescriptions fetched successfully",
    data: result,
  });
});

const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await prescriptionService.getAllPrescriptions();

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "All prescriptions fetched successfully",
    data: result,
  });
});

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
  const prescriptionId = req.params.id as string;

  const user = req.user as IRequestUser;
  const result = await prescriptionService.updatePrescription(
    user,
    prescriptionId,
    req.body,
  );
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prescription updated successfully",
    data: result,
  });
});

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
  const prescriptionId = req.params.id as string;

  const user = req.user as IRequestUser;
  const result = await prescriptionService.deletePrescription(
    user,
    prescriptionId,
  );
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prescription deleted successfully",
    data: result,
  });
});

export const prescriptionController = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
};
