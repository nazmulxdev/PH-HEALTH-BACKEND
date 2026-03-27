import status from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { IRequestUser } from "../admin/admin.interface";
import {
  ICreatePrescriptionPayload,
  IUpdatePrescriptionPayload,
} from "./prescription.interface";
import { generatePrescriptionPDF } from "./prescription.utils";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../lib/cloudinary.config";
import { sendEmail } from "../../utils/email";

const givePrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload,
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      },
      schedule: true,
    },
  });

  if (appointmentData.doctorId !== doctorData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only give prescription to your own appointments.",
    );
  }

  const isAlreadyPrescribed = await prisma.prescription.findFirst({
    where: {
      appointmentId: payload.appointmentId,
    },
  });

  if (isAlreadyPrescribed) {
    throw new AppError(
      status.BAD_REQUEST,
      "Prescription already given for this appointment.",
    );
  }

  const followUpDate = new Date(payload.followUpDate);

  const result = await prisma.$transaction(
    async (tx) => {
      const result = await tx.prescription.create({
        data: {
          ...payload,
          doctorId: doctorData.id,
          appointmentId: appointmentData.id,
          followUpDate: followUpDate,
          patientId: appointmentData.patientId,
        },
      });

      const pdfBuffer = await generatePrescriptionPDF({
        doctorName: doctorData.name,
        doctorEmail: doctorData.email,
        patientName: appointmentData.patient.name,
        patientEmail: appointmentData.patient.email,
        appointmentDate: appointmentData.schedule.startDateTime,
        instructions: payload.instructions,
        followUpDate: followUpDate,
        prescriptionId: result.id,
        createdAt: new Date(),
      });

      const fileName = `prescription-${Date.now()}-${result.id}.pdf`;

      const uploadFile = await uploadFileToCloudinary(pdfBuffer, fileName);

      const pdfUrl = uploadFile.secure_url;

      const updatePrescription = await tx.prescription.update({
        where: {
          id: result.id,
        },
        data: {
          pdfUrl: pdfUrl,
        },
      });

      try {
        const patient = appointmentData.patient;
        const doctor = appointmentData.doctor;

        await sendEmail({
          to: patient.email,
          subject: `You have received a new prescription from ${doctor.name}`,
          templateName: "prescription",
          templateData: {
            patientName: patient.name,
            doctorName: doctor.name,
            specialization: doctor.specialties
              .map((specialty) => specialty.specialty.title)
              .join(", "),
            prescriptionId: result.id,
            appointmentDate: new Date(
              appointmentData.schedule.startDateTime,
            ).toLocaleDateString(),
            issuedDate: new Date().toLocaleDateString(),
            followUpDate: followUpDate.toLocaleDateString(),
            instructions: payload.instructions,
            pdfUrl: pdfUrl,
          },
          attachments: [
            {
              filename: fileName,
              content: pdfUrl,
              contentType: "application/pdf",
              path: pdfUrl,
            },
          ],
        });
      } catch (error) {
        console.error(error);
        throw new AppError(400, "Failed to send email to patient.");
      }

      return updatePrescription;
    },
    {
      maxWait: 150000,
      timeout: 200000,
    },
  );

  return result;
};

const myPrescriptions = async (user: IRequestUser) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!isExistUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (isExistUser.role === "DOCTOR") {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctor: {
          email: user.email,
        },
      },
      include: {
        patient: true,
        appointment: true,
        doctor: true,
      },
    });

    return prescriptions;
  }

  if (isExistUser.role === "PATIENT") {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          email: user.email,
        },
      },
      include: {
        patient: true,
        appointment: true,
        doctor: true,
      },
    });
    return prescriptions;
  }
};

const getAllPrescriptions = async () => {
  const results = await prisma.prescription.findMany({
    include: {
      patient: true,
      appointment: true,
      doctor: true,
    },
  });
  return results;
};

const updatePrescription = async (
  userL: IRequestUser,
  prescriptionId: string,
  payload: IUpdatePrescriptionPayload,
) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      email: userL.email,
    },
  });

  if (!isExistUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const prescriptionData = await prisma.prescription.findUnique({
    where: {
      id: prescriptionId,
    },
    include: {
      patient: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
      doctor: {
        include: {
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      },
    },
  });

  if (!prescriptionData) {
    throw new AppError(status.NOT_FOUND, "Prescription not found");
  }

  if (!(prescriptionData.doctor.email === userL.email)) {
    throw new AppError(
      status.UNAUTHORIZED,
      "You are not authorized to update this prescription",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // prepare update data

    const updatedInstruction =
      payload.instructions || prescriptionData.instructions;
    const updatedFollowUpDate = payload.followUpDate
      ? new Date(payload.followUpDate)
      : prescriptionData.followUpDate;

    const pdfBuffer = await generatePrescriptionPDF({
      doctorName: prescriptionData.doctor.name,
      doctorEmail: prescriptionData.doctor.email,
      patientName: prescriptionData.patient.name,
      patientEmail: prescriptionData.patient.email,
      appointmentDate: prescriptionData.appointment.schedule.startDateTime,
      instructions: updatedInstruction,
      followUpDate: updatedFollowUpDate,
      prescriptionId: prescriptionData.id,
      createdAt: new Date(),
    });

    // step:2 upload new pdf to cloudinary

    const fileName = `prescription-${Date.now()}-${prescriptionData.id}.pdf`;

    const uploadFile = await uploadFileToCloudinary(pdfBuffer, fileName);

    const newPdfUrl = uploadFile.secure_url;

    // step:3 - delete file from cloudinary if file exist.
    if (prescriptionData.pdfUrl) {
      try {
        await deleteFileFromCloudinary(prescriptionData.pdfUrl);
      } catch (error) {
        console.log(error);
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to delete file from cloudinary.",
        );
      }
    }

    // step:4 - update prescription in the database

    const result = await tx.prescription.update({
      where: {
        id: prescriptionId,
      },
      data: {
        instructions: updatedInstruction,
        followUpDate: updatedFollowUpDate,
        pdfUrl: newPdfUrl,
      },
      include: {
        patient: true,
        appointment: {
          include: {
            schedule: true,
          },
        },
        doctor: true,
      },
    });

    // step:5 - sending email with new prescription
    try {
      await sendEmail({
        to: prescriptionData.patient.email,
        subject: `Your prescription has been updated`,
        templateName: "prescription",
        templateData: {
          patientName: prescriptionData.patient.name,
          doctorName: prescriptionData.doctor.name,
          specialization: prescriptionData.doctor.specialties
            .map((specialty) => specialty.specialty.title)
            .join(", "),
          prescriptionId: result.id,
          appointmentDate: new Date(
            prescriptionData.appointment.schedule.startDateTime,
          ).toLocaleDateString(),
          issuedDate: new Date().toLocaleDateString(),
          followUpDate: updatedFollowUpDate.toLocaleDateString(),
          instructions: updatedInstruction,
          pdfUrl: newPdfUrl,
        },
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
            path: newPdfUrl,
          },
        ],
      });
    } catch (error) {
      console.error(error);
    }

    return result;
  });

  return result;
};

const deletePrescription = async (
  user: IRequestUser,
  prescriptionId: string,
) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!isExistUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const prescriptionData = await prisma.prescription.findUnique({
    where: {
      id: prescriptionId,
    },
    include: {
      doctor: true,
    },
  });

  if (!prescriptionData) {
    throw new AppError(status.NOT_FOUND, "Prescription not found");
  }

  if (!(prescriptionData.doctor.email === user.email)) {
    throw new AppError(
      status.UNAUTHORIZED,
      "You are not authorized to delete this prescription",
    );
  }

  if (prescriptionData.pdfUrl) {
    try {
      await deleteFileFromCloudinary(prescriptionData.pdfUrl);
    } catch (error) {
      console.log(error);
      throw new AppError(400, "Failed to delete file from cloudinary.");
    }
  }
  const result = await prisma.prescription.delete({
    where: {
      id: prescriptionId,
    },
    include: {
      patient: true,
      appointment: true,
      doctor: true,
    },
  });

  return result;
};

export const prescriptionService = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
};
