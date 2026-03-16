import { Prisma } from "../../generated/prisma/client";

export const doctorSearchableFields = [
  "name",
  "email",
  "contactNumber",
  "registrationNumber",
  "qualification",
  "address",
  "designation",
  "currentWorkingPlace",
  "specialties.specialty.title",
];

export const doctorFilterableFields = [
  "gender",
  "isDeleted",
  "appointmentFee",
  "experience",
  "registrationNumber",
  "specialties.specialtyId",
  "specialties.specialty.title",
  "user.role",
];

export const doctorSortableFields = ["createdAt", "updatedAt "];

export const doctorIncludeConfig: Partial<
  Record<
    keyof Prisma.DoctorInclude,
    Prisma.DoctorInclude[keyof Prisma.DoctorInclude]
  >
> = {
  user: true,
  specialties: {
    include: {
      specialty: true,
    },
  },
  appointments: {
    include: {
      patient: true,
      doctor: true,
      prescription: true,
    },
  },
  doctorSchedules: {
    include: {
      schedule: true,
    },
  },
  prescriptions: true,
  reviews: true,
};
