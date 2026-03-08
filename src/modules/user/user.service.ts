import { Role, Specialty } from "../../generated/prisma/client";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { ICreateDoctorPayload } from "./user.interface";

const createDoctor = async (payload: ICreateDoctorPayload) => {
  const specialties: Specialty[] = [];
  for (const specialtyId of payload.specialties) {
    const specialty = await prisma.specialty.findUnique({
      where: {
        id: specialtyId,
      },
    });

    if (!specialty) {
      throw new AppError(
        404,
        "Specialty not found",
        "ERROR_SPECIALTY_NOT_FOUND",
        [{ field: "SPECIALTY", message: "Specialty not found" }],
      );
    }
    if (specialty) {
      specialties.push(specialty);
    }
  }
  const isExistDoctor = await prisma.doctor.findUnique({
    where: {
      email: payload.doctor.email,
    },
  });
  if (isExistDoctor) {
    throw new AppError(
      409,
      "Doctor already exist",
      "ERROR_DOCTOR_ALREADY_EXIST",
      [{ field: "DOCTOR", message: "Doctor already exist" }],
    );
  }

  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.doctor.email,
      password: payload.password,
      role: Role.DOCTOR,
      name: payload.doctor.name,
      needPasswordChange: true,
    },
  });

  try {
    const result = await prisma.$transaction(async (txx) => {
      const doctorData = await txx.doctor.create({
        data: {
          ...payload.doctor,
          userId: userData.user.id,
        },
      });

      const doctorSpecialtyData = specialties.map((specialty) => {
        return {
          doctorId: doctorData.id,
          specialtyId: specialty.id,
        };
      });

      await txx.doctorSpecialty.createMany({
        data: doctorSpecialtyData,
      });

      const doctor = await txx.doctor.findUnique({
        where: {
          id: doctorData.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          registrationNumber: true,
          experience: true,
          gender: true,
          appointmentFee: true,
          qualification: true,
          currentWorkingPlace: true,
          designation: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          deletedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              status: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              image: true,
              isDeleted: true,
              deletedAt: true,
            },
          },
          specialties: {
            select: {
              specialty: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      return doctor;
    });

    return result;
  } catch (error) {
    console.log(error);
    await prisma.user.delete({
      where: {
        id: userData.user.id,
      },
    });
    throw error;
  }
};

export const userService = {
  createDoctor,
};
