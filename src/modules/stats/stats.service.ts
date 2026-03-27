import { PaymentStatus, Role } from "../../generated/prisma/enums";
import { IRequestUser } from "../admin/admin.interface";
import AppError from "../../shared/AppError";
import { prisma } from "../../lib/prisma";

const getDashboardStatsData = async (user: IRequestUser) => {
  let statsData;
  switch (user.role) {
    case Role.SUPER_ADMIN:
      statsData = getSuperAdminStats();
      break;

    case Role.ADMIN:
      statsData = getAdminStats();
      break;

    case Role.DOCTOR:
      statsData = getDoctorStats(user);
      break;

    case Role.PATIENT:
      statsData = getPatientStats(user);
      break;

    default:
      throw new AppError(400, "Invalid user role", "INVALID_USER_ROLE", [
        {
          field: "role",
          message: "Invalid user role",
        },
      ]);
  }

  return statsData;
};

const getSuperAdminStats = async () => {
  const appointmentCount = await prisma.appointment.count();
  const doctorCount = await prisma.doctor.count();
  const patientCount = await prisma.patient.count();
  const adminCount = await prisma.admin.count();

  const superAdminCount = await prisma.admin.count({
    where: {
      user: {
        role: Role.SUPER_ADMIN,
      },
    },
  });
  const paymentCount = await prisma.payment.count();
  const userCount = await prisma.user.count();

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  const piChartData = await getPiChartData();
  const barChartData = await getBarChartData();

  return {
    appointmentCount: appointmentCount,
    doctorCount: doctorCount,
    patientCount: patientCount,
    superAdminCount: superAdminCount,
    adminCount: adminCount,
    paymentCount: paymentCount,
    userCount: userCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    piChartData: piChartData,
    barChartData: barChartData,
  };
};

const getAdminStats = async () => {
  const appointmentCount = await prisma.appointment.count();
  const doctorCount = await prisma.doctor.count();
  const patientCount = await prisma.patient.count();
  const adminCount = await prisma.admin.count();
  const paymentCount = await prisma.payment.count();
  const userCount = await prisma.user.count();

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  const piChartData = await getPiChartData();
  const barChartData = await getBarChartData();

  return {
    appointmentCount,
    doctorCount,
    patientCount,
    adminCount,
    paymentCount,
    userCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    piChartData: piChartData,
    barChartData: barChartData,
  };
};

const getDoctorStats = async (user: IRequestUser) => {
  const doctorDetails = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
    include: {
      user: true,
      appointments: true,
      reviews: true,
    },
  });

  const reviewCount = await prisma.review.count({
    where: {
      doctorId: doctorDetails.id,
    },
  });

  const patientCount = await prisma.appointment.groupBy({
    by: ["patientId"],
    _count: {
      id: true,
    },
    where: {
      doctorId: doctorDetails.id,
    },
  });

  const appointmentCount = await prisma.appointment.count({
    where: {
      doctorId: doctorDetails.id,
    },
  });

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      appointment: {
        doctorId: doctorDetails.id,
      },
      status: PaymentStatus.PAID,
    },
  });

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
    where: {
      doctorId: doctorDetails.id,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => {
      return { status, count: _count.id };
    });

  return {
    reviewCount,
    patientCount: patientCount.length,
    appointmentCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    appointmentStatusDistribution: formattedAppointmentStatusDistribution,
  };
};

const getPatientStats = async (user: IRequestUser) => {
  const patientDetails = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
    include: {
      user: true,
      appointments: true,
      reviews: true,
    },
  });

  const appointmentCount = await prisma.appointment.count({
    where: {
      patientId: patientDetails.id,
    },
  });

  const reviewCount = await prisma.review.count({
    where: {
      patientId: patientDetails.id,
    },
  });

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
    where: {
      patientId: patientDetails.id,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => {
      return { status, count: _count.id };
    });

  return {
    appointmentCount,
    reviewCount,
    formattedAppointmentStatusDistribution,
  };
};

const getPiChartData = async () => {
  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => {
      return { status, count: _count.id };
    });

  return formattedAppointmentStatusDistribution;
};

const getBarChartData = async () => {
  interface AppointmentCountByMonth {
    month: Date;
    count: bigint;
  }
  const appointmentCountByMonth: AppointmentCountByMonth[] =
    await prisma.$queryRaw`
        SELECT
         DATE_TRUNC('month',"createdAt") AS month,
        CAST(count(*) AS INTEGER) AS count
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC;
    `;

  return appointmentCountByMonth;
};

export const statsService = {
  getDashboardStatsData,
};
