import { Router } from "express";
import { doctorScheduleController } from "./doctorSchedule.controller";
import AuthMiddleWare from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.post(
  "/create-my-doctor-schedule",
  AuthMiddleWare(Role.DOCTOR),
  doctorScheduleController.createMyDoctorSchedule,
);
router.get(
  "/my-doctor-schedules",
  AuthMiddleWare(Role.DOCTOR),
  doctorScheduleController.getMyDoctorSchedules,
);
router.get(
  "/",
  AuthMiddleWare(Role.ADMIN, Role.SUPER_ADMIN),
  doctorScheduleController.getAllDoctorSchedules,
);
router.get(
  "/:doctorId/schedule/:scheduleId",
  AuthMiddleWare(Role.ADMIN, Role.SUPER_ADMIN),
  doctorScheduleController.getDoctorScheduleById,
);
router.patch(
  "/update-my-doctor-schedule",
  AuthMiddleWare(Role.DOCTOR),
  doctorScheduleController.updateMyDoctorSchedule,
);
router.delete(
  "/delete-my-doctor-schedule/:id",
  AuthMiddleWare(Role.DOCTOR),
  doctorScheduleController.deleteMyDoctorSchedule,
);

export const doctorScheduleRoute = router;
