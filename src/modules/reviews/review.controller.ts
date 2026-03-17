// const getReview = async () => {};

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";
import { reviewService } from "./review.service";
import { IRequestUser } from "../admin/admin.interface";

const giveReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = req.body;
  const result = await reviewService.giveReview(user, payload);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review given successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getAllReviews();

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data: result,
  });
});

const myReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await reviewService.myReviews(user);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "My reviews fetched successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const reviewId = req.params.id as string;
  const payload = req.body;
  const result = await reviewService.updateReview(user, reviewId, payload);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const reviewId = req.params.id as string;
  const result = await reviewService.deleteReview(user, reviewId);

  AppResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

export const reviewController = {
  getAllReviews,

  myReviews,

  giveReview,
  updateReview,
  deleteReview,
};
