import { Request, Response } from "express";
import status from "http-status";

import { AdminService } from "./admin.service";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";
import { AuthUser } from "../../types/express";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdmins();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins fetched successfully",
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const admin = await AdminService.getAdminById(id as string);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: admin,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const updatedAdmin = await AdminService.updateAdmin(id as string, payload);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin updated successfully",
    data: updatedAdmin,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as AuthUser;

  const result = await AdminService.deleteAdmin(id as string, user);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const payload = req.body;

  const result = await AdminService.changeUserStatus(user, payload);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User status changed successfully",
    data: result,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const payload = req.body;

  const result = await AdminService.changeUserRole(user, payload);

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User role changed successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  // const userId = req.params.id as string;
  // const user = req.user as AuthUser;

  const result = await AdminService.deleteUser();

  AppResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const AdminController = {
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAdminById,
  changeUserRole,
  changeUserStatus,
  deleteUser,
};
