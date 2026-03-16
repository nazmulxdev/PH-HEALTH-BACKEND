import { Request, Response } from "express";
import AppResponse from "../../shared/AppResponse";
import catchAsync from "../../shared/catchAsync";
import { scheduleService } from "./schedule.service";
import { IQueryParams } from "../../interfaces/query.interface";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.createSchedule(req.body);

  AppResponse(res, {
    success: true,
    statusCode: 201,
    message: "Schedule created successfully",
    data: result,
  });
});

const getAllSchedule = catchAsync(async (req: Request, res: Response) => {
  const queryParams = req.query as IQueryParams;

  const result = await scheduleService.getAllSchedule(queryParams);
  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "Schedule fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getScheduleById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await scheduleService.getScheduleById(id);

  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "Schedule retrieve successfully.",
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload = req.body;

  const result = await scheduleService.updateSchedule(id, payload);

  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "Schedule updated successfully",
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await scheduleService.deleteSchedule(id);

  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "Schedule deleted successfully",
    data: result,
  });
});

export const scheduleController = {
  createSchedule,
  getAllSchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
