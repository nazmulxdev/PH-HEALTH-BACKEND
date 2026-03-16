import { Router } from "express";
import { appointmentController } from "./appointment.controller";
import AuthMiddleWare from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.post(
  "/book-appointment",
  AuthMiddleWare(Role.PATIENT),
  appointmentController.bookAppointment,
);

router.get(
  "/my-appointments",
  AuthMiddleWare(Role.PATIENT, Role.DOCTOR),
  appointmentController.getMyAppointments,
);

router.patch(
  "/change-appointment-status/:id",
  AuthMiddleWare(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  appointmentController.changeAppointmentStatus,
);

router.get(
  "/my-single-appointment/:id",
  AuthMiddleWare(Role.PATIENT, Role.DOCTOR),
  appointmentController.getMySingleAppointment,
);

router.get(
  "/all-appointments",
  AuthMiddleWare(Role.ADMIN, Role.SUPER_ADMIN),
  appointmentController.getAllAppointments,
);

router.post(
  "/book-appointment-with-pay-later",
  AuthMiddleWare(Role.PATIENT),
  appointmentController.bookAppointmentWithPayLater,
);
router.post(
  "/initiate-payment/:id",
  AuthMiddleWare(Role.PATIENT),
  appointmentController.initiatePayment,
);

export const appointmentRoutes = router;
