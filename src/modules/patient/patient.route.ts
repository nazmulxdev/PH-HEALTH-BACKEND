import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { patientValidation } from "./patient.validation";
import { patientController } from "./patient.controller";
import { multerUpload } from "../../lib/multer.config";

import { updateMyPatientProfileMiddleWare } from "./patient.middlewares";

const router = Router();

router.patch(
  "/update-my-profile",
  authMiddleware(Role.PATIENT),
  multerUpload.fields([
    {
      name: "profilePhoto",
      maxCount: 1,
    },
    {
      name: "medicalReports",
      maxCount: 10,
    },
  ]),
  updateMyPatientProfileMiddleWare,
  validateRequest({
    body: patientValidation.updatePatientProfile,
  }),
  patientController.updateMyProfile,
);

export const patientRoutes = router;
