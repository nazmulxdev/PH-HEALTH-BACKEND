import { Router } from "express";
import { userController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createDoctorSchema } from "./user.validation";

const router = Router();

router.post(
  "/create-doctor",
  validateRequest({ body: createDoctorSchema }),
  userController.creteDoctor,
);

export const userRoute = router;
