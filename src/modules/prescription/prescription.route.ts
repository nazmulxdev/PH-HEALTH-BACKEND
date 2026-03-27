import express from "express";
import AuthMiddleWare from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";
import { prescriptionController } from "./prescription.controller";
import validateRequest from "../../middlewares/validateRequest";
import { prescriptionValidation } from "./prescription.validation";

const router = express.Router();

router.get(
  "/",
  AuthMiddleWare(Role.SUPER_ADMIN, Role.ADMIN),
  prescriptionController.getAllPrescriptions,
);

router.get(
  "/my-prescriptions",
  AuthMiddleWare(Role.PATIENT, Role.DOCTOR),
  prescriptionController.myPrescriptions,
);

router.post(
  "/",
  AuthMiddleWare(Role.DOCTOR),
  validateRequest({
    body: prescriptionValidation.createPrescriptionZodSchema,
  }),
  prescriptionController.givePrescription,
);

router.patch(
  "/:id",
  AuthMiddleWare(Role.DOCTOR),
  validateRequest({
    body: prescriptionValidation.updatePrescriptionZodSchema,
  }),
  prescriptionController.updatePrescription,
);

router.delete(
  "/:id",
  AuthMiddleWare(Role.DOCTOR),
  prescriptionController.deletePrescription,
);

export const PrescriptionRoutes = router;
