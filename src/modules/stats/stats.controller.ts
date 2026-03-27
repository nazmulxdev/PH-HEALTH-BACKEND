import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { IRequestUser } from "../admin/admin.interface";
import { statsService } from "./stats.service";
import AppResponse from "../../shared/AppResponse";

const getDashboardStatsData = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;

    const result = await statsService.getDashboardStatsData(user);

    AppResponse(res, {
      success: true,
      statusCode: 200,
      message: "Dashboard stats data fetched successfully",
      data: result,
    });
  },
);

export const statsController = {
  getDashboardStatsData,
};
