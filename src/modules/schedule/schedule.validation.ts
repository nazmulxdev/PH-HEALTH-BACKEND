// export interface ICreateSchedulePayload {
//   startDate: string;
//   endDate: string;
//   startTime: string;
//   endTime: string;
// }

import * as z from "zod";

const createScheduleZodSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  startTime: z
    .string()
    .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Invalid start time format",
    }),
  endTime: z
    .string()
    .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Invalid end time format",
    }),
});

const updateScheduleZodSchema = z.object({
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    })
    .optional(),
  startTime: z
    .string()
    .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Invalid start time format",
    })
    .optional(),
  endTime: z
    .string()
    .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Invalid end time format",
    })
    .optional(),
});

export const ScheduleValidation = {
  createScheduleZodSchema,
  updateScheduleZodSchema,
};
