import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { doctorService } from "./doctor.service";
import AppResponse from "../../shared/AppResponse";
import { IQueryParams } from "../../interfaces/query.interface";

const getAllDoctor = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as IQueryParams;
  const result = await doctorService.getAllDoctors(query);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctors fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

// get doctor by Id

const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await doctorService.getDoctorById(id);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor fetched successfully",
    data: result,
  });
});

// update doctor

const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload = req.body;
  const result = await doctorService.updateDoctorById(id, payload);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor updated successfully",
    data: result,
  });
});

// delete doctor

const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await doctorService.deleteDoctor(id);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor deleted successfully",
    data: result,
  });
});

export const doctorController = {
  getAllDoctor,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
