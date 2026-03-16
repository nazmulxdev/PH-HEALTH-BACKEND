import { Request, Response } from "express";
import AppResponse from "../../shared/AppResponse";
import catchAsync from "../../shared/catchAsync";
import { doctorScheduleService } from "./doctorSchedule.service";
import {
  ICreateDoctorSchedulePayload,
  IUpdateDoctorSchedulePayload,
} from "./doctorSchedule.interface";
import { IRequestUser } from "../admin/admin.interface";
import { IQueryParams } from "../../interfaces/query.interface";

const createMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body as ICreateDoctorSchedulePayload;

    const user = req.user as IRequestUser;

    const result = await doctorScheduleService.createMyDoctorSchedule(
      payload,
      user,
    );

    AppResponse(res, {
      success: true,
      statusCode: 201,
      message: "Doctor schedule created successfully",
      data: result,
    });
  },
);

const getMyDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const query = req.query as IQueryParams;

  const result = await doctorScheduleService.getMyDoctorSchedules(user, query);

  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "Doctor schedule fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAllDoctorSchedules = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as IQueryParams;
    const result = await doctorScheduleService.getAllDoctorSchedules(query);

    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Doctor's all schedule retrieve successfully",
      data: result.data,
      meta: result.meta,
    });
    //
  },
);

const getDoctorScheduleById = catchAsync(
  async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId as string;
    const scheduleId = req.params.scheduleId as string;

    const result = await doctorScheduleService.getDoctorScheduleById(
      doctorId,
      scheduleId,
    );
    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Doctor's schedule retrieve successfully",
      data: result,
    });
  },
);

const updateMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body as IUpdateDoctorSchedulePayload;

    const user = req.user as IRequestUser;

    const result = await doctorScheduleService.updateMyDoctorSchedule(
      user,
      payload,
    );

    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Doctor schedule updated successfully",
      data: result,
    });
  },
);

const deleteMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const user = req.user as IRequestUser;

    const result = await doctorScheduleService.deleteMyDoctorSchedule(id, user);

    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Doctor schedule deleted successfully",
      data: result,
    });
  },
);

export const doctorScheduleController = {
  createMyDoctorSchedule,
  getMyDoctorSchedules,
  getAllDoctorSchedules,
  getDoctorScheduleById,
  updateMyDoctorSchedule,
  deleteMyDoctorSchedule,
};
