import { Router } from "express";
import { specialtyController } from "./specialty.controller";

const router = Router();

// create specialty

router.post("/", specialtyController.createSpecialty);
router.get("/", specialtyController.getAllSpecialty);
router.patch("/", specialtyController.updateSpecialty);
router.delete("/:id", specialtyController.deleteSpecialty);

export const specialtyRoutes = router;
