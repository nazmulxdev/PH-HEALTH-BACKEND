import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoute } from "../modules/user/user.route";
import { doctorRoute } from "../modules/doctor/doctor.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { appointmentRoutes } from "../modules/appointment/appointment.route";
import { scheduleRoute } from "../modules/schedule/schedule.route";
import { doctorScheduleRoute } from "../modules/doctorSchedule/doctorSchedule.route";

const router = Router();

// authentication routes
router.use("/auth", authRoutes);

// user routes
router.use("/users", userRoute);

// doctor routes
router.use("/doctors", doctorRoute);

// specialty routes
router.use("/specialties", specialtyRoutes);

// admin routes
router.use("/admins", AdminRoutes);

// schedule routes
router.use("/schedules", scheduleRoute);

// doctor schedule routes
router.use("/doctor-schedules", doctorScheduleRoute);

//  appointment route
router.use("/appointments", appointmentRoutes);

export const indexRoutes = router;
