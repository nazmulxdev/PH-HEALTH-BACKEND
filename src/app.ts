/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application, Request, Response } from "express";
import { indexRoutes } from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandlers";
import notFoundErrorHandler from "./middlewares/notFoundErrorHandler";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import path from "node:path";
import cors from "cors";
import { config } from "./config/env";
import qs from "qs";
import { paymentController } from "./modules/payment/payment.controller";
import cron from "node-cron";
import { appointmentService } from "./modules/appointment/appointment.service";

const app: Application = express();

app.set("query parser", (str: string) => {
  return qs.parse(str);
});

app.set("view engine", "ejs");

app.set("views", path.resolve(process.cwd(), `src/templates`));

app.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentController.handleStripeWebHookEvent,
);

app.use(
  cors({
    origin: [config.FRONTEND_URL, config.BETTER_AUTH_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", toNodeHandler(auth));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule("*/30 * * * *", async () => {
  try {
    console.log("Running cron job to cancel unpaid appointments.");
    await appointmentService.cancelUnpaidAppointments();
  } catch (error: any) {
    console.error(error);
  }
});

app.use("/api/v1/", indexRoutes);

// root routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the ph health care.",
    success: true,
    docs: "/api/v1/docs",
    status: "Running",
  });
});

// 404 handler

app.use(notFoundErrorHandler);

// global error

app.use(globalErrorHandler);

export default app;
