import { Router } from "express";
import { scheduleController } from "./schedule.controller";
import validateRequest from "../../middlewares/validateRequest";
import { ScheduleValidation } from "./schedule.validation";

const router = Router();

router.post(
  "/",
  validateRequest({
    body: ScheduleValidation.createScheduleZodSchema,
  }),
  scheduleController.createSchedule,
);

router.get("/", scheduleController.getAllSchedule);

router.get("/:id", scheduleController.getScheduleById);

router.patch(
  "/:id",
  validateRequest({
    body: ScheduleValidation.updateScheduleZodSchema,
  }),
  scheduleController.updateSchedule,
);

router.delete("/:id", scheduleController.deleteSchedule);

export const scheduleRoute = router;
