import { Router } from "express";
import { doctorController } from "./doctor.controller";

const router = Router();

// get all doctor
router.get("/", doctorController.getAllDoctor);
// get doctor by id

router.get("/:id", doctorController.getDoctorById);

// update doctor

router.patch("/:id", doctorController.updateDoctor);

// delete doctor

router.delete("/:id", doctorController.deleteDoctor);

export const doctorRoute = router;
