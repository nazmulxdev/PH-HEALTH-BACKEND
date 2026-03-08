import * as z from "zod";
import { Gender } from "../../generated/prisma/enums";

export const createDoctorSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(20, "Password must be at most 20 characters long"),
  doctor: z.object({
    name: z.string(),
    email: z.email("Valid email is required"),
    profilePhoto: z.string("Profile photo is required").optional(),
    contactNumber: z
      .string("Contact number is required")
      .min(11, "Contact number must be 11 characters long")
      .max(14, "Contact number must be 14 characters long")
      .optional(),
    address: z.string("Address is required").optional(),
    registrationNumber: z.string("Registration number is required"),
    experience: z
      .int("Experience must be a number")
      .nonnegative("Experience must be a non-negative number")
      .optional(),
    gender: z.enum(
      [Gender.MALE, Gender.FEMALE],
      `Gender must be ${Gender.MALE} or ${Gender.FEMALE}`,
    ),
    appointmentFee: z
      .number("Appointment fee must be a number")
      .nonnegative("Appointment fee must be a non-negative number"),
    qualification: z.string("Qualification is required"),
    currentWorkingPlace: z.string("Current working place is required"),
    designation: z.string("Designation is required"),
  }),
  specialties: z
    .array(z.uuid("Specialty ID is required"))
    .min(1, "At least one specialty is required"),
});
