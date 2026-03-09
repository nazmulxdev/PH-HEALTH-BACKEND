import { Router } from "express";
import { specialtyController } from "./specialty.controller";
import authMiddleware from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

// create specialty

router.post("/", specialtyController.createSpecialty);
router.get(
  "/",
  authMiddleware(Role.PATIENT),
  specialtyController.getAllSpecialty,
);
router.patch("/", specialtyController.updateSpecialty);
router.delete("/:id", specialtyController.deleteSpecialty);

export const specialtyRoutes = router;
