import { Router } from "express";
import { specialtyController } from "./specialty.controller";

const router = Router();

// create specialty

router.post("/", specialtyController.createSpecialty);

export const specialtyRoutes = router;
