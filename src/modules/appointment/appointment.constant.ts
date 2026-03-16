import { Prisma } from "../../generated/prisma/client";

export const appointmentSearchableFields = [
  "videoCallingId",

  "doctor.name",
  "doctor.email",
  "doctor.contactNumber",
  "patient.name",
  "patient.email",
  "patient.contactNumber",
];

export const appointmentFilterableFields = [
  "status",
  "paymentStatus",
  "patientId",
  "doctor.gender",

  "patient.gender",

  "doctor.user.role",
];

export const appointmentSortableFields = [
  "createdAt",
  "updatedAt",
  "status",
  "paymentStatus",
];

export const appointmentIncludeConfig: Partial<
  Record<
    keyof Prisma.AppointmentInclude,
    Prisma.AppointmentInclude[keyof Prisma.AppointmentInclude]
  >
> = {
  patient: true,
  doctor: true,
  schedule: true,
  prescription: true,
  review: true,
  payment: true,
};
