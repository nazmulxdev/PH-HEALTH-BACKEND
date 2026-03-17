import status from "http-status";
import { PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { IRequestUser } from "../admin/admin.interface";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";

const giveReview = async (
  user: IRequestUser,
  payload: ICreateReviewPayload,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
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
      doctor: true,
    },
  });

  if (appointmentData.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only review after payment is done.",
    );
  }

  if (appointmentData.patientId !== patientData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only review your own appointments.",
    );
  }

  const isReviewed = await prisma.review.findFirst({
    where: {
      appointmentId: payload.appointmentId,
    },
  });

  if (isReviewed) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already reviewed this appointment.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        ...payload,
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
      },
    });

    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: appointmentData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: appointmentData.doctorId,
      },
      data: {
        averageRating: Number(averageRating._avg.rating),
      },
    });

    return review;
  });

  return result;
};

const getAllReviews = async () => {
  const review = await prisma.review.findMany({
    include: {
      patient: true,
      doctor: true,
      appointment: true,
    },
  });
  return review;
};

const myReviews = async (user: IRequestUser) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!isExistUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (isExistUser.role === "DOCTOR") {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
      where: {
        userId: isExistUser.id,
      },
      include: {
        reviews: true,
      },
    });

    return await prisma.review.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
  }

  if (isExistUser.role === "PATIENT") {
    const patientData = await prisma.patient.findUniqueOrThrow({
      where: {
        userId: isExistUser.id,
      },
    });

    return await prisma.review.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        appointment: true,
      },
    });
  }
};

const updateReview = async (
  user: IRequestUser,
  reviewId: string,
  payload: IUpdateReviewPayload,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id: reviewId,
    },
  });

  if (!(patientData.id === reviewData.patientId)) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only update your own reviews.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateReview = await tx.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...payload,
      },
    });

    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: updateReview.doctorId,
      },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });
    return updateReview;
  });

  return result;
};

const deleteReview = async (user: IRequestUser, reviewId: string) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id: reviewId,
    },
  });

  if (!(patientData.id === reviewData.patientId)) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only delete your own reviews.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const deleteReview = await tx.review.delete({
      where: {
        id: reviewId,
      },
    });
    const averageRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: {
        id: deleteReview.doctorId,
      },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });
    return deleteReview;
  });

  return result;
};

export const reviewService = {
  getAllReviews,
  myReviews,
  giveReview,
  updateReview,
  deleteReview,
};
