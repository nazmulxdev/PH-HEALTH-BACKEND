import { UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { IUpdateDoctorPayload } from "./doctor.interface";
// import { IUpdateDoctorPayload } from "./doctor.interface";
// import { auth } from "../../lib/auth";
// import { error } from "node:console";

// get all doctors
const getAllDoctors = async () => {
  const doctors = await prisma.doctor.findMany({
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
      user: true,
    },
  });
  console.log(doctors);

  return doctors;
};

// get doctor by id

const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: id,
      isDeleted: false,
    },
    include: {
      user: true,
      specialties: {
        include: {
          specialty: true,
        },
      },
      appointments: {
        include: {
          patient: true,
        },
      },
      doctorSchedules: {
        include: {
          schedule: true,
        },
      },
      reviews: {
        include: {
          patient: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new AppError(404, "Doctor not found", "ERROR_DOCTOR_NOT_FOUND", [
      { field: "DOCTOR", message: "Doctor not found" },
    ]);
  }

  return doctor;
};

// update doctor by id

const updateDoctorById = async (id: string, payload: IUpdateDoctorPayload) => {
  const isExistDoctor = await prisma.doctor.findUnique({
    where: {
      id: id,
    },
  });
  if (!isExistDoctor || isExistDoctor.isDeleted === true) {
    throw new AppError(404, "Doctor not found", "ERROR_DOCTOR_NOT_FOUND", [
      { field: "DOCTOR", message: "Doctor not found" },
    ]);
  }

  const { specialties, doctor } = payload;

  await prisma.$transaction(async (txx) => {
    if (doctor) {
      await txx.doctor.update({
        where: {
          id: id,
        },
        data: { ...doctor },
      });
    }

    if (specialties && specialties.length > 0) {
      for (const specialty of specialties) {
        const { specialtyId, shouldDelete } = specialty;
        if (shouldDelete) {
          await txx.doctorSpecialty.delete({
            where: {
              id: specialtyId,
            },
          });
        } else {
          await txx.doctorSpecialty.upsert({
            where: {
              doctorId_specialtyId: {
                doctorId: id,
                specialtyId,
              },
            },
            update: {},
            create: {
              doctorId: id,
              specialtyId: specialtyId,
            },
          });
        }
      }
    }
  });

  return await getDoctorById(id);
};

// delete doctor

const deleteDoctor = async (id: string) => {
  const isExistDoctor = await prisma.doctor.findUnique({
    where: {
      id: id,
    },
  });

  if (!isExistDoctor || isExistDoctor.isDeleted === true) {
    throw new AppError(404, "Doctor not found", "ERROR_DOCTOR_NOT_FOUND", [
      { field: "DOCTOR", message: "Doctor not found" },
    ]);
  }

  try {
    const result = await prisma.$transaction(async (txx) => {
      await txx.user.update({
        where: {
          id: isExistDoctor.userId,
        },
        data: {
          isDeleted: true,
          status: UserStatus.DELETED,
          deletedAt: new Date(),
        },
      });
      await txx.doctor.update({
        where: {
          id: id,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      await txx.doctorSpecialty.deleteMany({
        where: {
          doctorId: id,
        },
      });
      await txx.doctorSchedules.deleteMany({
        where: {
          doctorId: id,
        },
      });

      return { message: "Doctor deleted successfully" };
    });

    return result;
  } catch (error) {
    console.error(error);
    throw new AppError(
      500,
      "Something went wrong",
      "ERROR_SOMETHING_WENT_WRONG",
      [{ field: "DOCTOR", message: "Something went wrong" }],
    );
  }
};

export const doctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctorById,
  deleteDoctor,
};
