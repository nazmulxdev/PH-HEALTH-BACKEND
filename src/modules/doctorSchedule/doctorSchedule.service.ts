import { DoctorSchedules, Prisma } from "../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IRequestUser } from "../admin/admin.interface";
import {
  doctorScheduleFilterableFields,
  doctorScheduleIncludeConfig,
  doctorScheduleSearchableFields,
} from "./doctorSchedule.constant";
import {
  ICreateDoctorSchedulePayload,
  IUpdateDoctorSchedulePayload,
} from "./doctorSchedule.interface";

const createMyDoctorSchedule = async (
  payload: ICreateDoctorSchedulePayload,
  user: IRequestUser,
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorScheduleData = payload.scheduleIds.map((id) => {
    return {
      doctorId: doctorData.id,
      scheduleId: id,
    };
  });

  const result = await prisma.doctorSchedules.createMany({
    data: doctorScheduleData,
  });

  return result;
};

const getMyDoctorSchedules = async (
  user: IRequestUser,
  query: IQueryParams,
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const queryBuilder = new QueryBuilder<
    DoctorSchedules,
    Prisma.DoctorSchedulesWhereInput,
    Prisma.DoctorSchedulesInclude
  >(
    prisma.doctorSchedules,
    {
      doctorId: doctorData.id,
      ...query,
    },
    {
      searchableFields: doctorScheduleSearchableFields,
      filterableFields: doctorScheduleFilterableFields,
    },
  );

  const doctorSchedule = await queryBuilder
    .search()
    .filter()
    .paginate()
    .include({
      schedule: true,
      doctor: {
        include: {
          user: true,
        },
      },
    })
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .fields()
    .execute();

  return doctorSchedule;
};

const getAllDoctorSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    DoctorSchedules,
    Prisma.DoctorSchedulesWhereInput,
    Prisma.DoctorSchedulesInclude
  >(prisma.doctorSchedules, query, {
    searchableFields: doctorScheduleSearchableFields,
    filterableFields: doctorScheduleFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .fields()
    .execute();

  return result;
};

const getDoctorScheduleById = async (doctorId: string, scheduleId: string) => {
  const result = await prisma.doctorSchedules.findUnique({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorId,
        scheduleId: scheduleId,
      },
    },
    include: {
      schedule: true,
      doctor: true,
    },
  });

  return result;
};

const updateMyDoctorSchedule = async (
  user: IRequestUser,
  payload: IUpdateDoctorSchedulePayload,
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const deleteIds = payload.scheduleIds
    .filter((schedule) => schedule.shouldDelete === true)
    .map((schedule) => schedule.id);

  const createIds = payload.scheduleIds
    .filter((schedule) => schedule.shouldDelete === false)
    .map((schedule) => schedule.id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.doctorSchedules.deleteMany({
      where: {
        doctorId: doctorData.id,
        scheduleId: {
          in: deleteIds,
        },
      },
    });

    const doctorScheduleData = createIds.map((id) => {
      return {
        doctorId: doctorData.id,
        scheduleId: id,
      };
    });

    const result = await tx.doctorSchedules.createMany({
      data: doctorScheduleData,
    });

    return result;
  });

  return result;
};

const deleteMyDoctorSchedule = async (id: string, user: IRequestUser) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const result = await prisma.doctorSchedules.deleteMany({
    where: {
      doctorId: doctorData.id,
      scheduleId: id,
      isBooked: false,
    },
  });

  return result;
};

export const doctorScheduleService = {
  createMyDoctorSchedule,
  getAllDoctorSchedules,
  getDoctorScheduleById,
  updateMyDoctorSchedule,
  deleteMyDoctorSchedule,
  getMyDoctorSchedules,
};
