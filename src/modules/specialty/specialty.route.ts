import { Router } from "express";
import { specialtyController } from "./specialty.controller";
// import authMiddleware from "../../middlewares/AuthMiddleware";
// import { Role } from "../../generated/prisma/enums";
import { multerUpload } from "../../lib/multer.config";
import validateRequest from "../../middlewares/validateRequest";
import { specialtyValidation } from "./specialty.validation";

const router = Router();

// create specialty

router.post(
  "/",
  multerUpload.single("file"),
  validateRequest({
    body: specialtyValidation.createSpecialtyZdSchema,
  }),
  specialtyController.createSpecialty,
);

router.get(
  "/",
  // authMiddleware(Role.PATIENT),
  specialtyController.getAllSpecialty,
);
router.patch("/", specialtyController.updateSpecialty);
router.delete("/:id", specialtyController.deleteSpecialty);

export const specialtyRoutes = router;
