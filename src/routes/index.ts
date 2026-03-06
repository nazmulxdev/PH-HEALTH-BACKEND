import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoute } from "../modules/user/user.route";

const router = Router();

// authentication routes
router.use("/auth", authRoutes);

// user routes
router.use("/users", userRoute);

// specialty routes
router.use("/specialties", specialtyRoutes);

export const indexRoutes = router;
