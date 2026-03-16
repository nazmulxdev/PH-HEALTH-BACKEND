import { v7 as uuidv7 } from "uuid";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../admin/admin.interface";
import { IBookAppointmentPayload } from "./appointment.interface";
import AppError from "../../shared/AppError";
import {
  AppointmentStatus,
  PaymentStatus,
  Role,
} from "../../generated/prisma/enums";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Appointment, Prisma } from "../../generated/prisma/client";
import {
  scheduleFilterableFields,
  scheduleSearchableFields,
} from "../schedule/schedule.constant";
import {
  appointmentIncludeConfig,
  appointmentSortableFields,
} from "./appointment.constant";
import { stripe } from "../../config/stripe.config";
import { config } from "../../config/env";

// book appointment with pay naw

const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const { doctorId, scheduleId } = payload;

  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: doctorId,
      isDeleted: false,
    },
  });

  const doctorSchedules = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        scheduleId: scheduleId,
        doctorId: doctorId,
      },
    },
  });

  if (doctorSchedules.isBooked) {
    throw new AppError(
      400,
      "This schedule is already booked.",
      "SCHEDULE_ALREADY_BOOKED",
      [{ field: "schedule", message: "This schedule slot is already booked." }],
    );
  }

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: scheduleId,
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorId,
        scheduleId: doctorSchedules.scheduleId,
        videoCallingId: videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: scheduleData.id,
        },
      },
      data: {
        isBooked: true,
      },
    });

    /**
     * TODO: payment integration will be here
     * */

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData.id,
      },
      success_url: `${config.FRONTEND_URL}/dashboard/payment/payment-success`,
      cancel_url: `${config.FRONTEND_URL}/dashboard/payment/payment-failed`,
    });

    return {
      appointmentData,
      paymentData,
      paymentUrl: session.url,
    };
  });

  return result;
};

const getMyAppointments = async (user: IRequestUser) => {
  // user can be patient or doctor , so we need to check both

  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  let appointments;

  if (patientData) {
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: { doctor: true, schedule: true },
    });
  } else if (doctorData) {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new AppError(404, "No appointments found", "No appointments found", [
      {
        field: "appointments",
        message: "No appointments found",
      },
    ]);
  }

  return appointments;
};

/**
 * 1. Completed or canceled should not be allowed update status.
 *
 * 2. Doctors can only be update Appointment status from schedule to inprogress or inprogress to completed or schedule to cancelled.
 *
 * 3. Patients can only cancel the appointment if it scheduled not completed or cancelled oor in progress.
 *
 * 4. Admin and super admin can update to any status.
 *
 * */

const changeAppointmentStatus = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      isDeleted: false,
      // status: AppointmentStatus.SCHEDULED,
    },
    include: {
      doctor: true,
    },
  });

  // if (!appointmentData) {
  //   throw new AppError(404, "Appointment not found", "Appointment not found", [
  //     {
  //       field: "appointment",
  //       message: "Appointment not found",
  //     },
  //   ]);
  // }

  if (user?.role === Role.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email)) {
      throw new AppError(403, "This is not your appointment", "Forbidden", [
        {
          field: "appointment",
          message: "Forbidden",
        },
      ]);
    }
  }
};

const getMySingleAppointment = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUnique({
    where: {
      email: user?.email,
    },
  });

  let appointment;

  if (patientData) {
    appointment = await prisma.appointment.findUniqueOrThrow({
      where: {
        id: appointmentId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointment = await prisma.appointment.findUniqueOrThrow({
      where: {
        id: appointmentId,
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new AppError(404, "No appointments found", "NO_APPOINTMENTS_FOUND", [
      {
        field: "appointment",
        message: "No appointments found",
      },
    ]);
  }

  return appointment;
};

const getAllAppointments = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Appointment,
    Prisma.AppointmentWhereInput,
    Prisma.AppointmentInclude
  >(prisma.appointment, query, {
    searchableFields: scheduleSearchableFields,
    filterableFields: scheduleFilterableFields,
    sortableFields: appointmentSortableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(appointmentIncludeConfig)
    .sort()
    .fields()
    .execute();
  return result;
};

// book appointment without payment

const bookAppointmentWithPayLater = async (
  user: IRequestUser,
  payload: IBookAppointmentPayload,
) => {
  const { doctorId, scheduleId } = payload;

  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: doctorId,
      isDeleted: false,
    },
  });

  const doctorSchedules = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        scheduleId: scheduleId,
        doctorId: doctorId,
      },
    },
  });

  if (doctorSchedules.isBooked) {
    throw new AppError(
      400,
      "This schedule is already booked.",
      "SCHEDULE_ALREADY_BOOKED",
      [{ field: "schedule", message: "This schedule slot is already booked." }],
    );
  }

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: scheduleId,
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorId,
        scheduleId: doctorSchedules.scheduleId,
        videoCallingId: videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: scheduleData.id,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
        status: PaymentStatus.PENDING,
      },
    });

    return { appointment: appointmentData, payment: paymentData };
  });

  return result;
};

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!patientData) {
    throw new AppError(404, "Patient not found", "PATIENT_NOT_FOUND", [
      {
        field: "patient",
        message: "Patient not found",
      },
    ]);
  }

  const appointmentData = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  if (!appointmentData) {
    throw new AppError(404, "Appointment not found", "APPOINTMENT_NOT_FOUND", [
      {
        field: "appointment",
        message: "Appointment not found",
      },
    ]);
  }

  if (!appointmentData.payment) {
    throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND", [
      {
        field: "payment",
        message: "Payment not found",
      },
    ]);
  }

  if (appointmentData?.payment?.status == PaymentStatus.PAID) {
    throw new AppError(
      400,
      "Payment already completed for this  appointment.",
      "PAYMENT_ALREADY_DONE",
      [
        {
          field: "Payment",
          message: "Payment already completed.",
        },
      ],
    );
  }

  if (appointmentData?.status === AppointmentStatus.CANCELED) {
    throw new AppError(
      400,
      "Appointment already has cancelled.",
      "APPOINTMENT_CANCELLED",
      [
        {
          field: "Payment",
          message: "Appointment has cancelled.",
        },
      ],
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with ${appointmentData?.doctor?.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointmentData?.id,
      paymentId: appointmentData?.payment?.id,
    },
    success_url: `${config.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData?.payment?.id}`,
    cancel_url: `${config.FRONTEND_URL}/dashboard/payment/payment-failed`,
  });

  return {
    paymentUrl: session.url,
  };
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      paymentStatus: PaymentStatus.PENDING,
      createdAt: {
        lte: thirtyMinutesAgo,
      },
    },
  });

  const appointmentToCancel = unpaidAppointments.map(
    (appointment) => appointment.id,
  );

  await prisma.$transaction(async (tx) => {
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentToCancel,
        },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentToCancel,
        },
        status: PaymentStatus.PENDING,
      },
    });

    for (const unpaidAppointment of unpaidAppointments) {
      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unpaidAppointment.doctorId,
            scheduleId: unpaidAppointment.scheduleId,
          },
        },
        data: {
          isBooked: false,
        },
      });
    }
  });
};

export const appointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  cancelUnpaidAppointments,
};
