import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";
import { appointmentService } from "./appointment.service";
import { IBookAppointmentPayload } from "./appointment.interface";
import { IRequestUser } from "../admin/admin.interface";
import { IQueryParams } from "../../interfaces/query.interface";

const bookAppointment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as IBookAppointmentPayload;
  const user = req.user as IRequestUser;

  const result = await appointmentService.bookAppointment(payload, user);
  AppResponse(res, {
    success: true,
    statusCode: 201,
    message: "Appointment booked successfully",
    data: result,
  });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await appointmentService.getMyAppointments(user);
  AppResponse(res, {
    success: true,
    statusCode: 200,
    message: "My appointments fetched successfully",
    data: result,
  });
});

const changeAppointmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user as IRequestUser;

    const result = await appointmentService.changeAppointmentStatus(id, user);
    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Appointment status changed successfully",
      data: result,
    });
  },
);

const getMySingleAppointment = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user as IRequestUser;

    const result = await appointmentService.getMySingleAppointment(id, user);

    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "My appointment fetched successfully",
      data: result,
    });
  },
);

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as IQueryParams;

  const result = await appointmentService.getAllAppointments(query);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "retrieve all appointment successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const bookAppointmentWithPayLater = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;

    const payload = req.body as IBookAppointmentPayload;

    const result = await appointmentService.bookAppointmentWithPayLater(
      user,
      payload,
    );
    AppResponse(res, {
      statusCode: 200,
      success: true,
      message: "retrieve all appointment successfully.",
      data: result,
    });
  },
);

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = req.params.id as string;

  const user = req.user as IRequestUser;

  const result = await appointmentService.initiatePayment(appointmentId, user);
  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment initiated successfully.",
    data: result,
  });
});

export const appointmentController = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
};
