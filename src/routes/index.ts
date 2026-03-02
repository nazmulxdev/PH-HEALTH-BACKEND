import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";

const router = Router();

router.use("/specialties", specialtyRoutes);

export const indexRoutes = router;
