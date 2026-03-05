import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";
import { authRoutes } from "../modules/auth/auth.routes";

const router = Router();

// authentication routes
router.use("/auth", authRoutes);

// specialty routes
router.use("/specialties", specialtyRoutes);

export const indexRoutes = router;
