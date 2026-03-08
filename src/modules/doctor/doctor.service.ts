import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
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
    },
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
      user: true,
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

// const updateDoctorById = async (id: string, payload: IUpdateDoctorPayload) => {
//   const isExistDoctor = await prisma.doctor.findUnique({
//     where: {
//       id: id,
//     },
//   });
//   if (!isExistDoctor || isExistDoctor.isDeleted === true) {
//     throw new AppError(404, "Doctor not found", "ERROR_DOCTOR_NOT_FOUND", [
//       { field: "DOCTOR", message: "Doctor not found" },
//     ]);
//   }

//   const { password, doctor } = payload;

//   const {
//     name,
//     email,
//     profilePhoto,
//     contactNumber,
//     address,
//     registrationNumber,
//     experience,
//     gender,
//     appointmentFee,
//     qualification,
//     currentWorkingPlace,
//     designation,
//   } = doctor;

//   if (password) {
//     const userData = await auth.api.requestPasswordReset({
//         body:{
//             email:email,
//         }
//     })
// };

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
        },
      });
      await txx.doctor.update({
        where: {
          id: id,
        },
        data: {
          isDeleted: true,
        },
      });
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
  //   updateDoctorById,
  deleteDoctor,
};
