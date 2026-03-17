import express from "express";
import { Role } from "../../generated/prisma/enums";
import AuthMiddleWare from "../../middlewares/AuthMiddleware";
import validateRequest from "../../middlewares/validateRequest";
import { reviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

router.get("/", reviewController.getAllReviews);

router.post(
  "/",
  AuthMiddleWare(Role.PATIENT),
  validateRequest({
    body: ReviewValidation.createReviewZodSchema,
  }),
  reviewController.giveReview,
);

router.get(
  "/my-reviews",
  AuthMiddleWare(Role.PATIENT, Role.DOCTOR),
  reviewController.myReviews,
);

router.patch(
  "/:id",
  AuthMiddleWare(Role.PATIENT),
  validateRequest({
    body: ReviewValidation.updateReviewZodSchema,
  }),
  reviewController.updateReview,
);

router.delete(
  "/:id",
  AuthMiddleWare(Role.PATIENT),
  reviewController.deleteReview,
);

export const ReviewRoutes = router;
