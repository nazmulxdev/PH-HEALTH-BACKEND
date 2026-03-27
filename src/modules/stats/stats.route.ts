import { Router } from "express";
import authMiddleware from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";
import { statsController } from "./stats.controller";

const router = Router();

router.get(
  "/stats",
  authMiddleware(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.PATIENT),
  statsController.getDashboardStatsData,
);

export const statsRoute = router;
