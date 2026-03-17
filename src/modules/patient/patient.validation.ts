import * as z from "zod";
import { BloodGroup, Gender } from "../../generated/prisma/enums";

const updatePatientProfileZodSchema = z.object({
  patientInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      profilePhoto: z.string().optional(),
      contactNumber: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),

  patientHealthData: z
    .object({
      gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
      dateOfBirth: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "Invalid date of birth format.",
        })
        .optional(),
      bloodGroup: z
        .enum([
          BloodGroup.A_POSITIVE,
          BloodGroup.A_NEGATIVE,
          BloodGroup.B_POSITIVE,
          BloodGroup.B_NEGATIVE,
          BloodGroup.AB_POSITIVE,
          BloodGroup.AB_NEGATIVE,
          BloodGroup.O_POSITIVE,
          BloodGroup.O_NEGATIVE,
        ])
        .optional(),
      hasAllergies: z.boolean().optional(),
      hasDiabetes: z.boolean().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      smokingStatus: z.boolean().optional(),
      dietaryPreferences: z.string().optional(),
      pregnancyStatus: z.boolean().optional(),
      mentalHealthHistory: z.string().optional(),
      immunizationStatus: z.string().optional(),
      hasPastSurgeries: z.boolean().optional(),
      recentAnxiety: z.boolean().optional(),
      recentDepression: z.boolean().optional(),
      maritalStatus: z.string().optional(),
    })
    .optional(),
  medicalReports: z
    .array(
      z.object({
        reportName: z.string().optional(),
        reportLink: z.string().optional(),
        shouldDelete: z.boolean().optional(),
        reportId: z.uuid().optional(),
      }),
    )
    .optional()
    .refine(
      (reports) => {
        if (!reports || reports.length === 0) {
          return true;
        }

        for (const report of reports) {
          if (report.shouldDelete === true && !report.reportId) {
            return false;
          }

          if (report.reportId && !report.shouldDelete) {
            return false;
          }

          if (!report.reportName && !report.reportLink) {
            return false;
          }

          if (report.reportName && !report.reportLink) {
            return false;
          }

          return true;
        }
      },
      {
        message: "Invalid report data format.",
      },
    ),
});

export const patientValidation = {
  updatePatientProfile: updatePatientProfileZodSchema,
};
