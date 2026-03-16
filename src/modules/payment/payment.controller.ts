/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { config } from "../../config/env";
import status from "http-status";
import { stripe } from "../../config/stripe.config";

import { paymentService } from "./payment.service";
import AppResponse from "../../shared/AppResponse";
import AppError from "../../shared/AppError";

const handleStripeWebHookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    const webhookSecret = config.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret.");

      throw new AppError(
        status.BAD_REQUEST,
        "Missing signature or webhook secret.",
        "MISSING_SIGNATURE_OR_WEBHOOK_SECRET",
        [{ field: "stripe", message: "Missing signature or webhook secret." }],
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (error: any) {
      console.error("Error processing strip webhook: ", error);
      throw new AppError(
        status.BAD_REQUEST,
        "Error processing stripe webhook.",
        "STRIPE_WEBHOOK_ERROR",
        [{ field: "stripe", message: error.message }],
      );
    }

    try {
      const result = await paymentService.handleStripeWebHookEvent(event);

      AppResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Stripe webhook event processed successfully.",
        data: result,
      });
    } catch (error: any) {
      console.error("message: ", error);
      throw new AppError(
        status.BAD_REQUEST,
        "Error processing stripe webhook.",
        "STRIPE_WEBHOOK_ERROR",
        [{ field: "stripe", message: error.message }],
      );
    }
  },
);

export const paymentController = {
  handleStripeWebHookEvent,
};
